//
// Copyright 2015-2017, Noah Kantrowitz
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

const fs = require('fs');

const Base = require('../base');

module.exports = Base.extend({
  initializing: function() {
    if(!this.config.get('created')) {
      // Check if it was actually already created outside of yo.
      var remotes = this.spawnCommandSync('git', ['remote', '-v'], {stdio: ['ignore', 'pipe', 'ignore']}).stdout.toString();
      if(/github\.com/.test(remotes)) {
        // It was created.
        this.config.set('created', true);
      }
    }
    // Track if created was set before prompting.
    this.wasCreated = this.config.get('created');
  },
  prompting: function () {
    var prompts = [];

    // If a name isn't set, prompt to confirm.
    if(!this.config.get('name')) {
      prompts.push({
        type: 'input',
        name: 'name',
        message: 'Your gem name',
        default: this.appname.replace(/\s+/g, '-'),
      });
      prompts.push({
        type: 'input',
        name: 'cookbookName',
        message: 'Your cookbook name',
        default: 'auto',
      });
    }

    // If we haven't created yes, ask.
    if(!this.config.get('created')) {
      prompts.push({
        type: 'confirm',
        name: 'created',
        message: 'Create on GitHub?',
        default: false,
      });
    }

    return this.prompt(prompts).then(function (answers) {
      if(answers.name) this.config.set('name', answers.name);
      if(answers.cookbookName) this.config.set('cookbookName', answers.cookbookName);
      if(answers.created) this.config.set('created', answers.created);
    }.bind(this));
  },
  writing: function () {
    if(!this._folderExists('.git')) this.spawnCommandSync('git', ['init']);
    if(this.config.get('created') && !this.wasCreated) {
      // Create the GitHub repo and enable Travis-CI.
      this.spawnCommandSync('git', ['create', 'poise/'+this.config.get('name')]);
      this.spawnCommandSync('travis', ['enable', '--no-interactive']);
    }

    var copyTpl = function(path, context) {
      context = context || {};
      context.gemName = context.requireName || this.config.get('name');
      context.cookbookName = context.cookbookName || this.config.get('cookbookName');
      if(context.cookbookName == 'auto') {
        context.cookbookName = context.gemName.replace(/(^(chef|cookbook)[_-])|([_-](chef|cookbook))$/g, '');
      }
      context.requireName = context.requireName || context.gemName.replace(/-/g, '_');
      context.displayName = context.displayName || context.gemName.replace(/(_|\b)(\w+)/g, function(match, p1, p2) { return p1 + p2[0].toLocaleUpperCase() + p2.substr(1) });
      context.moduleName = context.moduleName || context.gemName.replace(/(-|_|\b)([^_-]+)/g, function(match, p1, p2) { return p2[0].toLocaleUpperCase() + p2.substr(1) });
      context.pathName = context.pathName || context.requireName;
      this.copyTpl(path, context);
    }.bind(this);

    var copyTplOnce = function(path, context) {
      context = context || {};
      context.once = true;
      copyTpl(path, context);
    }.bind(this);

    copyTpl('.gitignore');
    copyTplOnce('.kitchen.yml');
    copyTpl('.yardopts');
    copyTplOnce('CHANGELOG.md', {});
    // Read the existing Gemfile and grab all the user-specfied content.
    var gemfileUser = null;
    if(this.fs.exists(this.destinationPath('Gemfile'))) {
      const gemfile = this.fs.read(this.destinationPath('Gemfile'));
      // Everything after the dev_gem function definition is saved. Make sure
      // to not include the last newline because that lives in the template.
      gemfileUser = gemfile.match(/\ndef dev_gem[^]+\nend\n([^]*?)\n?$/)[1];
    }
    copyTpl('Gemfile', {gemfileUser: gemfileUser});
    copyTpl('LICENSE');
    copyTpl('Rakefile');
    // Need to specify the filename because it doesn't follow the usual pattern,
    // uses the gemName not the requireName.
    copyTplOnce('app.gemspec', {out: this.config.get('name')+'.gemspec'});
    copyTplOnce('README.md');
    if(!this._folderExists('lib')) {
      copyTplOnce('chef/attributes/default.rb');
      copyTplOnce('chef/recipes/default.rb');
      copyTpl('lib/app.rb');
      copyTpl('lib/app/cheftie.rb');
      copyTpl('lib/app/resources.rb');
      copyTpl('lib/app/version.rb');
      copyTpl('lib/app/resources/app.rb');
    }
    if(!this._folderExists('test')) {
      copyTpl('test/cookbook/metadata.rb')
      copyTpl('test/cookbook/recipes/default.rb')
    }
    copyTplOnce('test/spec/spec_helper.rb')
  },
  _folderExists: function(path) {
    try {
      fs.accessSync(this.destinationPath(path));
      return true;
    } catch(e) {
      return false;
    }
  }
});
