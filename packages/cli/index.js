'use strict';

/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */

const GROWN_TXT = `
   \u001b[32m▄████  ██▀███   ▒█████   █     █░███▄    █\u001b[39m
  \u001b[32m██▒ ▀█▒▓██ ▒ ██▒▒██▒  ██▒▓█░ █ ░█░██ ▀█   █\u001b[39m
 \u001b[32m▒██░▄▄▄░▓██ ░▄█ ▒▒██░  ██▒▒█░ █ ░█▓██  ▀█ ██▒\u001b[39m
 \u001b[32m░▓█  ██▓▒██▀▀█▄  ▒██   ██░░█░ █ ░█▓██▒  ▐▌██▒\u001b[39m
 \u001b[32m░▒▓███▀▒░██▓ ▒██▒░ ████▓▒░░░██▒██▓▒██░   ▓██░\u001b[39m
  \u001b[32m░▒   ▒ ░ ▒▓ ░▒▓░░ ▒░▒░▒░ ░ ▓░▒ ▒ ░ ▒░   ▒ ▒\u001b[39m
   \u001b[32m░   ░   ░▒ ░ ▒░  ░ ▒ ▒░   ▒ ░ ░ ░ ░░   ░ ▒░\u001b[39m
   \u001b[32m░   ░   ░░   ░ ░ ░ ░ ▒    ░   ░    ░   ░ ░\u001b[39m
       \u001b[32m░    ░         ░ ░      ░            ░\u001b[39m
`;

const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');

module.exports = (Grown, util) => {
  Grown.use(require('@grown/logger'));

  const logger = util.getLogger();

  const thisPkg = require('./package.json');
  const mainPkg = path.join(Grown.cwd, 'package.json');
  const appPkg = fs.existsSync(mainPkg)
    ? require(mainPkg)
    : {};

  const baseDir = path.resolve(Grown.cwd, path.dirname(appPkg.main || mainPkg));

  function _findAvailableTasks() {
    /* istanbul ignore else */
    if (!this._tasks) {
      const taskDirs = util.flattenArgs(this.task_folders || path.join(baseDir, 'tasks'));
      const taskFiles = this._collectTasks(taskDirs, path.join(__dirname, 'bin/tasks'));

      this._tasks = taskFiles;
    }

    return this._tasks;
  }

  function _findApplication() {
    const baseName = appPkg.name || path.basename(path.dirname(Grown.cwd));

    const files = [
      `lib/${baseName}/application.js`,
      `lib/${baseName}/server.js`,
      `lib/${baseName}/index.js`,
      `lib/${baseName}.js`,
      'lib/application.js',
      'lib/server.js',
      `${baseName}.js`,
      'application.js',
      'server.js',
      'index.js',
    ];

    let mainFile;

    /* istanbul ignore else */
    if (files.indexOf(appPkg.main) === -1) {
      files.push(appPkg.main);
    }

    for (let i = 0; i < files.length; i += 1) {
      /* istanbul ignore else */
      if (fs.existsSync(files[i])) {
        mainFile = files[i];
        break;
      }
    }

    /* istanbul ignore else */
    if (!mainFile) {
      throw new Error(`Missing application script (e.g: ${files.join(', ')})`);
    }

    /* istanbul ignore else */
    if (!fs.existsSync(mainFile)) {
      throw new Error(`Missing ${mainFile}`);
    }

    return mainFile;
  }

  function _collectTasks() {
    const dirs = util.flattenArgs(arguments);
    const files = {};

    dirs.forEach(cwd => {
      /* istanbul ignore else */
      /* istanbul ignore else */
      if (fs.existsSync(cwd)) {
        fs.readdirSync(cwd)
          .filter(x => x.indexOf('.js') > -1)
          .forEach(x => {
            files[x.replace('.js', '')] = path.join(cwd, x);
          });
      }
    });

    return files;
  }

  function _showTasks(taskName) {
    logger.printf('{% gray Grown CLI v%s (node %s ─ %s) %}\n',
      thisPkg.version, process.version, process.env.NODE_ENV);

    this._findAvailableTasks();

    /* istanbul ignore else */
    if (taskName && !this._tasks[taskName]) {
      throw new Error(`Unknown task '${taskName}'`);
    }

    /* istanbul ignore else */
    if (taskName && !Grown.argv.flags.help) {
      return logger(taskName, () =>
        new Promise((cb, reject) => {
          /* istanbul ignore else */
          if (!Grown.argv.flags.app && taskName === 'up') {
            Grown.argv.flags.app = this._findApplication();
          }

          this._exec(Grown.argv.raw, () => {
            try {
              cb(this.run(taskName));
            } catch (e) {
              reject(e);
            }
          });
        }))
        .catch(e => this._onError(e));
    }

    logger.write(GROWN_TXT);
  }

  function _showHelp(taskName) {
    if (!taskName) {
      logger.printf('\n {% gray Tasks: %}\n');

      let maxLength = 0;

      Object.keys(this._tasks).sort()
        .map(x => {
          /* istanbul ignore else */
          if (x.length > maxLength) {
            maxLength = x.length;
          }

          return x;
        })
        .forEach(x => {
          const task = require(this._tasks[x]);
          const desc = (task.description || '').trim().split('\n')[0];
          const pad = new Array((maxLength + 1) - x.length).join(' ');

          logger.printf('   {% gray %s %s # %s %}\n', x, pad, desc);
        });
    } else {
      logger.printf('\n {% green %s %} {% gray ─ %s %}\n', taskName,
        require(this._tasks[taskName]).description
          .split('\n')
          .join('\n ')
          .trim());
    }

    logger.write('\n');
  }

  function _onError(e) {
    /* istanbul ignore else */
    if (e.errors) {
      e.errors.forEach(err => {
        logger.printf('{% exception %s (%s) %}\r\n', err.message, err.type);
      });
    }

    /* istanbul ignore else */
    if (!Grown.argv.flags.debug) {
      e = util.cleanError(e, Grown.cwd);
    }

    if (e.original) {
      /* istanbul ignore else */
      if (e.original.detail) {
        logger.printf('{% failure %s %}\r\n', e.original.detail);
      }

      logger.printf('{% failure %s %}\r\n', e.original.message);
    }

    logger.printf('\r{% error %s %}\r\n', e.stack || e.message);
    process.exit(1);
  }

  function _onExit(statusCode) {
    /* istanbul ignore else */
    if (!statusCode) {
      logger.printf('\r\r{% end Done %}\n');
    }
  }

  function _exec(argv, callback) {
    process.on('SIGINT', () => process.exit());
    process.on('exit', this._onExit);

    if (argv.length) {
      const child = spawn(argv[0], argv.slice(1));

      // clear previous logs...
      process.stdout.write('\x1b[K\r');

      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);

      child.on(process.version.split('.')[1] === '6' ? 'exit' : 'close', exitCode => {
        if (exitCode !== 0) {
          process.exit(1);
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  }

  return Grown('CLI', {
    _findAvailableTasks,
    _findApplication,
    _collectTasks,
    _showTasks,
    _showHelp,
    _onError,
    _onExit,
    _exec,

    // shared
    _tasks: null,

    start(taskName) {
      /* istanbul ignore else */
      if (!Grown.CLI._showTasks(taskName)) {
        Grown.CLI._showHelp(taskName);
      }
    },

    run(taskName) {
      this._findAvailableTasks();

      /* istanbul ignore else */
      if (!this._tasks[taskName]) {
        throw new Error(`Task ${taskName} is not registered`);
      }

      try {
        const task = require(this._tasks[taskName]);

        return task.callback(Grown, util);
      } catch (e) {
        throw new Error(`Task '${taskName}': ${e.message}`);
      }
    },
  });
};
