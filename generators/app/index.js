//
// Copyright 2015, Noah Kantrowitz
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

var generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  prompting: function () {
    var done = this.async();
    this.prompt({
      type: 'input',
      name: 'name',
      message: 'Your cookbook name',
      default: this.appname
    }, function (answers) {
      this.cookbookName = answers.name;
      done();
    }.bind(this));
  },
  writing: function () {
    if(!this.fs.exists('.git')) this.spawnCommandSync('git', ['init']);
    var copyTpl = function(path, context, once) {
      if(once && this.fs.exists(this.destinationPath(path))) return;
      context = context || {};
      context.cookbookName = context.cookbookName || this.cookbookName;
      context.displayName = context.displayName || context.cookbookName.replace(/(_|\b)(\w+)/g, function(match, p1, p2) { return p1 + p2[0].toLocaleUpperCase() + p2.substr(1) });
      context.requireName = context.requireName || this.cookbookName.replace(/-/, '_');
      this.fs.copyTpl(this.templatePath(path), this.destinationPath(path), context);
    }.bind(this);
    copyTpl('.gitignore');
    copyTpl('.kitchen.yml');
    copyTpl('.travis.yml');
    copyTpl('.yardopts');
    copyTpl('Berksfile');
    copyTpl('CHANGELOG.md', {}, true);
    copyTpl('Gemfile');
    copyTpl('LICENSE');

  }
});
