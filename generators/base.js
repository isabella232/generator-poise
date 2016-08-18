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
var generators = require('yeoman-generator');

module.exports = generators.Base.extend({
  copyTpl: function(path, context, once) {
    var destPath = this.destinationPath(path)
    if(once && this.fs.exists(destPath)) return;
    var content = this.fs.read(destPath, {defaults: ''});
    context = context || {};
    context._ = context._ || _;
    context.copyright = content.match(/Copyright.*$/gm) || ['Copyright ' + (new Date().getFullYear()) + ', Noah Kantrowitz'];
    // context.cookbookName = context.cookbookName || this.cookbookName;
    // context.displayName = context.displayName || context.cookbookName.replace(/(_|\b)(\w+)/g, function(match, p1, p2) { return p1 + p2[0].toLocaleUpperCase() + p2.substr(1) });
    // context.requireName = context.requireName || this.cookbookName.replace(/-/, '_');
    this.fs.copyTpl(this.templatePath(context.template || path), destPath, context);
  }
});
