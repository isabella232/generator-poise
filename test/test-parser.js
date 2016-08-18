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
var assert = require('yeoman-generator').assert;
var editor = require('mem-fs-editor');
var fs = require('fs');
var memFs = require('mem-fs');
var path = require('path');

var parser = require('../app/parser');

describe('parser', function() {
  [
    {name: 'non-existant', parse: {dependencies: []}},
    {name: 'blank', parse: {dependencies: []}},
    {name: 'complex', parse: {name: 'poise-supervisor', dependencies: [
      {name: 'halite', type: 'runtime', version: '~> 1.0'},
      {name: 'poise', type: 'runtime',  version: '~> 2.0'},
      {name: 'poise-python', type: 'runtime', version: '>= 0'},
      {name: 'poise-service', type: 'runtime', version: '>= 0'},
      {name: 'poise-boiler', type: 'development' ,version: '~> 1.0'},
      {name: 'poise-other', type: 'development', version: '>= 0'},
    ]}},
  ].forEach(function(test) {
    var gemspec = test.name + '.gemspec';
    var gemspecPath = path.join(__dirname, 'fixtures', gemspec);
    it('should parse '+gemspec, function () {
      var memfs = editor.create(memFs.create());
      var out = parser(memfs, gemspecPath);
      assert.deepEqual(out, test.parse);
    });
  });
});
