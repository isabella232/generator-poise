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
const Generator = require('yeoman-generator');

module.exports = Generator.extend({
  copyTpl: function(path, context) {
    context = context || {};
    context.pathName = context.pathName || 'app';
    var destPath = this.destinationPath(context.out || path.replace(/\bapp\b/g, context.pathName));
    if(context.once && this.fs.exists(destPath)) return;
    var content = this.fs.read(destPath, {defaults: ''});
    context._ = context._ || _;
    context.copyright = content.match(/Copyright.*$/gm) || ['Copyright ' + (new Date().getFullYear()) + ', Noah Kantrowitz'];
    this.fs.copyTpl(this.templatePath(context.template || path), destPath, context);
  }
});
