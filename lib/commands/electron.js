'use strict';

const RSVP = require('rsvp');
const fs = require('fs-extra');
const quickTemp = require('quick-temp');
const path = require('path');

const Command = require('./-command');
const Logger = require('../utils/logger');
const symlinkOrCopySync = require('symlink-or-copy').sync;
const WatchedBuild = require('../utils/watched-build');
const efStart = require('electron-forge/dist/api/start').default;

const { Promise } = RSVP;

module.exports = Command.extend({
  name: 'electron',
  description: 'Builds your app and launches Electron',

  availableOptions: [{
    name: 'environment',
    type: String,
    default: 'development',
    aliases: [
      'e',
      { dev: 'development' },
      { prod: 'production' },
    ],
  }, {
    name: 'output-path',
    type: String,
    default: quickTemp.makeOrRemake(this, '-electron-livereload'),
    aliases: ['o'],
  }, {
    name: 'verbose',
    type: Boolean,
    default: false,
    aliases: ['v'],
  }],

  run(options) {
    let logger = new Logger(this);

    process.on('exit', () => {
      this._cleanup(options);
    });

    return this._buildAndWatch(options, logger)
      .then(() => this._startElectron(options, logger));
  },

  _buildAndWatch({ environment, outputPath }, logger = new Logger(this)) {
    const { ui, project, analytics } = this;
    const watchedBuild = new WatchedBuild({
      ui,
      project,
      analytics,
      environment,
      outputPath,
    });

    // n.b. start logging progress after init to prevent immediate build-related
    //      output from stopping the spinner
    logger.startProgress('Building');

    return watchedBuild;
  },

  _symlinkModules(outputPath) {
    const source = path.join(this.project.root, 'node_modules');
    const target = path.join(outputPath, 'node_modules');

    symlinkOrCopySync(source, target);
  },

  _startElectron({ outputPath, verbose }, logger = new Logger(this)) {
    logger.message('Starting Electron...');

    this._symlinkModules(outputPath);

    return efStart({ appPath: outputPath, dir: outputPath })
      .then((handle) => new Promise((resolve/* , reject */) => {
        handle.on('close', (code, signal) => {
          if (verbose) {
            logger.section([
              'Electron closed',
              `  - with code: ${code}`,
              `  - with signal: ${signal}`,
            ]);
          }
        });

        handle.on('disconnect', () => {
          if (verbose) {
            logger.message('Electron disconnected.');
          }
        });

        handle.on('error', (err) => {
          logger.error(err);
        });

        handle.on('exit', (/* code, signal */) => {
          logger.message('Electron exited.');
          resolve();
        });

        handle.on('message', (message) => {
          logger.message(message);
        });
      }));
  },

  _cleanup({ outputPath }) {
    return fs.removeSync(outputPath);
  },
});
