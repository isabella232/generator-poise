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

const _ = require('lodash');
const fs = require('fs');
const generators = require('yeoman-generator');
const semver = require('semver');
const yaml = require('js-yaml');

const Base = require('../base');

const RUBY_21_GEMS = {
  foodcritic: '< 8',
  fauxhai: '<= 3.9.0',
  chefspec: '< 6',
  'ffi-yajl': '< 2.3.1',
  byebug: '< 9.1.0',
  'mixlib-shellout': '< 2.3.0',
  'mixlib-config': '< 2.2.5',
  'test-kitchen': '< 1.17.0',
};

const RUBY_21_BERKS_GEMS = {
  nio4r: '< 2',
  'buff-extensions': '< 2',
};

const VERSIONS = {
  '12.0.3': {ruby: '2.1.4', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.1.2': {ruby: '2.1.4', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.2.1': {ruby: '2.1.4', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.3.0': {ruby: '2.1.4', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.4.3': {ruby: '2.1.6', gems: _.merge({rack: '< 2', gh: '0.14.0'}, RUBY_21_GEMS), berksGems: _.merge({ridley: '4.4.1'}, RUBY_21_BERKS_GEMS)},
  '12.5.1': {ruby: '2.1.6', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.6.0': {ruby: '2.1.6', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.7.2': {ruby: '2.1.6', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.8.1': {ruby: '2.1.6', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.9.41': {ruby: '2.1.8', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.10.24': {ruby: '2.1.8', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.11.18': {ruby: '2.1.8', gems: _.merge({rack: '< 2'}, RUBY_21_GEMS), berksGems: RUBY_21_BERKS_GEMS},
  '12.12.15': {ruby: '2.1.8', gems: RUBY_21_GEMS, berksGems: RUBY_21_BERKS_GEMS},
  '12.13.37': {ruby: '2.1.9', gems: RUBY_21_GEMS, berksGems: RUBY_21_BERKS_GEMS},
  '12.14.89': {ruby: '2.3.1'},
  '12.15.19': {ruby: '2.3.1'},
  '12.16.42': {ruby: '2.3.1'},
  '12.17.44': {ruby: '2.3.1'},
  '12.18.31': {ruby: '2.3.1'},
  '12.19.36': {ruby: '2.3.1'},
  '12.20.3': {ruby: '2.3.1'},
  '12.21.31': {ruby: '2.3.1'},
  '13.0.118': {ruby: '2.4.1'},
  '13.1.31': {ruby: '2.4.1'},
  '13.2.20': {ruby: '2.4.1'},
  '13.3.42': {ruby: '2.4.1'},
  '13.4.24': {ruby: '2.4.2'},
  '13.5.3': {ruby: '2.4.2'},
  '13.6.4': {ruby: '2.4.2'},
  //'13.7.16': {ruby: '2.4.3'}, // I'm ignoring 13.7, the attribute problems breaks a lot of my cookbooks. Sorry.
  '13.8.0': {ruby: '2.4.3'},
  '13.9.4': {ruby: '2.4.3'},
  '13.10.4': {ruby: '2.4.3'},
  '14.0.202': {ruby: '2.5.1'},
  '14.1.12': {ruby: '2.5.1'},
  '14.2.0': {ruby: '2.5.1'},
  '14.3.37': {ruby: '2.5.1'},
  '14.4.56': {ruby: '2.5.1'},
};
// Add in major and minor versions because we use them a bunch.
_.forOwn(VERSIONS, function(context, version) {
  context.version = version;
  context.majorVersion = semver.major(version);
  context.minorVersion = semver.major(version) + '.' + semver.minor(version);
});

module.exports = Base.extend({
  writing: function () {
    // Find the gemspec.
    const gemspecPath = this.config.get('name') ? (this.config.get('name') + '.gemspec') : _(fs.readdirSync(this.destinationPath())).find(function(p) { return p.endsWith('.gemspec'); });
    const gemspec = this.fs.read(this.destinationPath(gemspecPath));
    // Parse a line like spec.add_dependency 'chef', '~> 12.1'
    const rawChefDep = gemspec.match(/spec.add_dependency\s*\(?\s*['"]chef['"],\s*['"]([^'"]+)['"]/);
    const chefDep = rawChefDep ? rawChefDep[1].replace(/~>\s*/, '^') : '> 0';
    // Figure out which versions we are going to use.
    const travisVersions = _.pickBy(VERSIONS, function(context) { return semver.satisfies(context.version, chefDep); });

    // Figure out the data for the current major versions.
    var byMajorVersion = {};
    _.forOwn(travisVersions, function(context) {
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
      this._writeGemfile(gemfilePath, context.minorVersion, context);
    }.bind(this));
    // Write out a master gemfile.
    this._writeMasterGemfile();
    travisMatrix.push({
      // Master build at the end.
      rvm: '2.5.1',
      gemfile: 'test/gemfiles/master.gemfile',
    });
    // Build the matrix and gemfiles for minor versions.
    if(!this.config.get('noMinor')) {
      _.forOwn(travisVersions, function(context) {
        var gemfilePath = 'test/gemfiles/chef-'+context.minorVersion+'.gemfile';
        travisMatrix.push({rvm: context.ruby, gemfile: gemfilePath});
        this._writeGemfile(gemfilePath, context.version, context);
      }.bind(this));
    }
    // Generate a Travis config.
    var travisYaml = {
      dist: 'trusty',
      sudo: false,
      cache: 'bundler',
      language: 'ruby',
      env: {global: _.map(this._travisSecrets(), function(secret) { return {secure: secret}; })},
      before_install: [
        'if [[ $BUNDLE_GEMFILE == *master.gemfile ]]; then gem update --system; fi',
        'gem --version',
        'gem install bundler',
        'bundle --version',
        'bundle config --local path ${BUNDLE_PATH:-$(dirname $BUNDLE_GEMFILE)/vendor/bundle}',
        'bundle config --local bin $PWD/bin',
      ],
      install: 'bundle update --jobs=3 --retry=3',
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
    // Delete any gemfiles that don't match the matrix.
    const existingGemfiles = fs.readdirSync(this.destinationPath('test/gemfiles'));
    _.forEach(existingGemfiles, function(path) {
      // Ignore lockfiles.
      if(path.endsWith('.lock')) return;
      const fullPath = 'test/gemfiles/' + path;
      // Check if this matches the Travis matrix.
      if(!_.some(travisMatrix, function(mat) { return mat.gemfile == fullPath; })) {
        this.fs.delete(fullPath);
      }
    }.bind(this));
  },
  end: function() {
  },
  _travisSecrets: function() {
    // Parse out existing travis encrypted values.
    var travis = yaml.safeLoad(this.fs.read(this.destinationPath('.travis.yml'), {defaults: ''}));
    return _.chain(travis).get('env.global', []).filter(function(item) {
      return _.isObject(item) && item.secure;
    }).map(function(item) { return item.secure; }).value();
  },
  _writeGemfile: function(path, chefVersion, context) {
    var berksMode = this.fs.exists(this.destinationPath('Berksfile'));
    var gems = _.merge({}, context.gems || {}, berksMode ? (context.berksGems || {}) : {});
    this.copyTpl(path, _.merge({template: 'gemfile.rb', chefVersion: chefVersion, allGems: gems, master: false}, context));
  },
  _writeMasterGemfile: function() {
    // Default master-branch test gems.
    var gems = {
      chef: 'chef/chef',
      chefspec: 'sethvargo/chefspec',
      halite: 'poise/halite',
      fauxhai: 'customink/fauxhai',
      foodcritic: 'foodcritic/foodcritic',
      ohai: 'chef/ohai',
    }
    // Parse the Gemfile to get the list of dev_gem calls.
    var gemfile = this.fs.read(this.destinationPath('Gemfile'));
    var devGemRE = /dev_gem ['"]([^"']+)['"](?:.*(?:, github: ['"]([^"']+)['"]))?/g;
    this.devGems = {};
    var m, m2;
    while(m = devGemRE.exec(gemfile)) {
      var defaultGem = 'poise/' + m[1];
      if(m2 = m[1].match(/^poise-(application.*)$/)) {
        defaultGem = 'poise/' + m2[1].replace(/-/g, '_');
      }
      gems[m[1]] = m[2] || defaultGem;
    }
    // Write out the template.
    var outPath = this.destinationPath('test/gemfiles/master.gemfile');
    this.copyTpl(outPath, {template: 'gemfile.rb', master: true, allGems: gems});
  }
});
