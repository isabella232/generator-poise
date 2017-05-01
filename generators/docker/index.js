//
// Copyright 2017, Noah Kantrowitz
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

const crypto = require('crypto');
const fs = require('fs');

const _ = require('lodash');
const chalk = require('chalk');
const yaml = require('js-yaml');

const Base = require('../base');

module.exports = Base.extend({
  writing: function() {
    var caPath = this.config.get('ca_path') || `${process.env.HOME}/src/poise-docker/tls`;
    // Create the test/docker/ folder.
    if(!this._folderExists(this.destinationPath('test'))) {
      fs.mkdirSync(this.destinationPath('test'));
      this.log(`   ${chalk.green('create')} test`);
    }
    if(!this._folderExists(this.destinationPath('test/docker'))) {
      fs.mkdirSync(this.destinationPath('test/docker'));
      this.log(`   ${chalk.green('create')} test/docker`);
    }
    // Generate key.
    this._create('docker.key', function(path) {
      this._cmd('openssl', ['genrsa', '-out', path, '4096']);
    });
    // Generate CSR.
    this._create('docker.csr', function(path) {
      this._cmd('openssl', ['req', '-new', '-key', this._path('docker.key'), '-subj', `/CN=Docker client for ${this.config.get('name')}/OU=kitchen-docker/O=Coderanger Consulting LLC`, '-out', path]);
    });
    // Sign certificate.
    this._create('docker.crt', function(path) {
      this._cmd('openssl', ['x509', '-req', '-days', '3650', '-CA', `${caPath}/ca.crt`, '-CAkey', `${caPath}/ca.key`, '-CAserial', `${caPath}/ca.srl`, '-extfile', `${caPath}/extfile.cnf`, '-in', this._path('docker.csr'), '-out', path]);
    });
    // Copy over the CA cert.
    this.fs.write(this._path('docker.ca'), this.fs.read(`${caPath}/ca.crt`));
    // Generate key passphrase.
    this._create('docker.pass', function(path) {
      // Don't use this.fs.write() because we need it available immediately.
      fs.writeFileSync(path, crypto.randomBytes(30).toString('base64'));
    });
    // Encrypt key.
    this._create('docker-enc.key', function(path) {
      this._cmd('openssl', ['rsa', '-in', this._path('docker.key'), '-out', path, '-aes256', '-passout', `file:${this._path('docker.pass')}`])
    });
    // Concat cert and encrypted key.
    this.fs.write(this._path('docker.pem'), this.fs.read(this._path('docker.crt')) + this.fs.read(this._path('docker-enc.key')));
    // Try to encrypt passphrase for Travis.
    var travisCmd = this.spawnCommandSync('travis', ['encrypt', `KITCHEN_DOCKER_PASS=${this.fs.read(this._path('docker.pass'))}`, '--skip-version-check', '--no-interactive'], {stdio: ['ignore', 'pipe', 'ignore']});
    if(travisCmd.status == 0) {
      // Add encrypted variable to Travis config.
      var encrypted = travisCmd.stdout.slice(1, -1);
      var travis = yaml.safeLoad(this.fs.read(this.destinationPath('.travis.yml'), {defaults: ''}));
      if(!travis.env) travis.env = {};
      if(!travis.env.global) travis.env.global = [];
      if(!_.find(travis.env.global, function(env) { return env.secure == encrypted})) {
        travis.env.global.push({secure: encrypted});
      }
      this.fs.write(this.destinationPath('.travis.yml'), yaml.safeDump(travis, {lineWidth: 10000000}));
    } else {
      this.log(`     ${chalk.red('fail')} travis encrypt`);
    }
    // Force-add the two important files.
    var lsFiles = this.spawnCommandSync('git', ['ls-files'], {stdio: ['ignore', 'pipe', 'ignore']});
    if(!/$test\/docker\/docker\.pem$/m.test(lsFiles.stdout)) {
      this.spawnCommandSync('git', ['add', '--force', 'test/docker/docker.pem']);
    }
    if(!/$test\/docker\/docker\.ca$/m.test(lsFiles.stdout)) {
      this.spawnCommandSync('git', ['add', '--force', 'test/docker/docker.ca']);
    }
  },
  _path: function(path) {
    return this.destinationPath('test/docker/'+path);
  },
  _cmd: function(command, args) {
    var cmd = this.spawnCommandSync(command, args);
    if(cmd.error) {
      this.env.error(`Command ${command}${args ? ' '+args.join(' ') : ''} errored: ${cmd.error.toString()}`);
    } else if(cmd.status != 0) {
      this.env.error(`Command ${command}${args ? ' '+args.join(' ') : ''} failed (${cmd.status})`);
    }
  },
  _folderExists: function(path) {
    try {
      fs.accessSync(path);
      return true;
    } catch(e) {
      return false;
    }
  },
  _create: function(path, createFn) {
    var dockerPath = this._path(path);
    if(!this._folderExists(dockerPath)) {
      createFn.bind(this)(dockerPath);
      this.log(`   ${chalk.green('create')} test/docker/${path}`);
    } else {
      this.log(`${chalk.cyan('identical')} test/docker/${path}`);
    }
  }
});
