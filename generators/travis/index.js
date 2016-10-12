//
// Copyright 2016, Noah Kantrowitz
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
'use strict';

var _ = require('lodash');
var fs = require('fs');
var generators = require('yeoman-generator');
var semver = require('semver');
var yaml = require('js-yaml');

var Base = require('../base');

var VERSIONS = {
  '12.0.3': {ruby: '2.1.4', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.1.2': {ruby: '2.1.4', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.2.1': {ruby: '2.1.4', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.3.0': {ruby: '2.1.4', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.4.3': {ruby: '2.1.6', gems: {rack: '< 2', ridley: '4.4.1', foodcritic: '< 8'}},
  '12.5.1': {ruby: '2.1.6', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.6.0': {ruby: '2.1.6', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.7.2': {ruby: '2.1.6', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.8.1': {ruby: '2.1.6', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.9.41': {ruby: '2.1.8', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.10.24': {ruby: '2.1.8', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.11.18': {ruby: '2.1.8', gems: {rack: '< 2', foodcritic: '< 8'}},
  '12.12.15': {ruby: '2.1.8', {foodcritic: '< 8'}},
  '12.13.37': {ruby: '2.1.9', {foodcritic: '< 8'}},
  '12.14.60': {ruby: '2.3.1'},
}
// Add in major and minor versions because we use them a bunch.
_.forOwn(VERSIONS, function(context, version) {
  context.version = version;
  context.majorVersion = semver.major(version);
  context.minorVersion = semver.major(version) + '.' + semver.minor(version);
});

module.exports = Base.extend({
  initializing: function() {
    // Parse out existing travis encrypted values.
    var travis = yaml.safeLoad(this.fs.read(this.destinationPath('.travis.yml'), {defaults: ''}));
    this.travisSecrets = _.chain(travis).get('env.global', []).filter(function(item) {
      return _.isObject(item) && item.secure;
    }).map(function(item) { return item.secure; }).value();
    // Find the gemspec. This should probably check the mem-fs before looking on
    // the real file system.
    var gemspecPath = _(fs.readdirSync(this.destinationPath())).find(function(p) { return p.endsWith('.gemspec'); });
    var gemspec = this.fs.read(this.destinationPath(gemspecPath));
    // Parse a line like spec.add_dependency 'chef', '~> 12.1'
    var chefDep = gemspec.match(/spec.add_dependency\s*\(?\s*['"]chef['"],\s*['"]([^'"']+)['"]/);
    chefDep = chefDep ? chefDep[1].replace(/~>\s*/, '^') : '> 0';
    // Figure out which versions we are going to use.
    this.travisVersions = _.pickBy(VERSIONS, function(context) { return semver.satisfies(context.version, chefDep); });

  },
  prompting: function () {
  },
  writing: function () {
    // Figure out the data for the current major versions.
    var byMajorVersion = {};
    _.forOwn(this.travisVersions, function(context) {
      byMajorVersion[context.majorVersion] = byMajorVersion[context.majorVersion] || [];
      byMajorVersion[context.majorVersion].push(context);
    });
    var majorVersions = _.mapValues(byMajorVersion, function(versions) {
      versions.sort(function(a, b) { return semver.compare(a.version, b.version); });
      return _.last(versions);
    });
    var travisMatrix = []
    // Build the matrix and gemfiles for major versions.
    _.forOwn(majorVersions, function(context) {
      var gemfilePath = 'test/gemfiles/chef-'+context.majorVersion+'.gemfile';
      travisMatrix.push({rvm: context.ruby, gemfile: gemfilePath});
      this.copyTpl(gemfilePath, _.merge({template: 'gemfile.rb', chefVersion: context.minorVersion, gems: {}, master: false}, context));
    }.bind(this));
    // Build the matrix and gemfiles for minor versions.
    _.forOwn(this.travisVersions, function(context) {
      var gemfilePath = 'test/gemfiles/chef-'+context.minorVersion+'.gemfile';
      travisMatrix.push({rvm: context.ruby, gemfile: gemfilePath});
      this.copyTpl(gemfilePath, _.merge({template: 'gemfile.rb', chefVersion: context.version, gems: {}, master: false}, context));
    }.bind(this));
    // Write out a master gemfile if one doesn't already exist. Not handle regen
    // on this for now because I don't want to walk to Ruby dependency graph.
    var masterGemfilePath = this.destinationPath('test/gemfiles/master.gemfile')
    if(!this.fs.exists(masterGemfilePath)) {
      this.copyTpl(masterGemfilePath, {template: 'gemfile.rb', master: true});
    }
    travisMatrix.push({
      // Master build at the end.
      rvm: '2.3.1',
      gemfile: 'test/gemfiles/master.gemfile',
    });
    // Generate a Travis config.
    var travisYaml = {
      sudo: false,
      cache: 'bundler',
      language: 'ruby',
      env: {global: _.map(this.travisSecrets, function(secret) { return {secure: secret}; })},
      before_install: 'gem install bundler',
      bundler_args: '--binstubs=$PWD/bin --jobs 3 --retry 3',
      script: ['./bin/rake travis'],
      matrix: {include: travisMatrix},
    };
    // We need some extra stuff for berks if present.
    if(this.fs.exists(this.destinationPath('Berksfile'))) {
      travisYaml.addons = {apt: {packages: ['libgecode-dev']}};
      travisYaml.env.global = travisYaml.env.global || [];
      travisYaml.env.global.push('USE_SYSTEM_GECODE=true');
    }
    // Use a stupidly long lineWidth because I don't like the >- continuation markers.
    this.fs.write(this.destinationPath('.travis.yml'), yaml.safeDump(travisYaml, {lineWidth: 10000000}));
  },
  end: function() {
  }
});
