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

const ARGV_FLAGS = `
  -V, --verbose  # Used with --debug to enable DEBUG='*' and disable logs
  -d, --debug    # Used to expand error details during failures
  -e, --env      # Custom NODE_ENV for the current process

  Add --help to any command for usage info.
`;

const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');

module.exports = (Grown, util) => {
  Grown.use(require('@grown/logger'));

  const logger = util.getLogger();

  const mainPkg = path.join(Grown.cwd, 'package.json');
  const appPkg = (fs.existsSync(mainPkg) && require(mainPkg)) || {};
  const baseDir = path.resolve(Grown.cwd, path.dirname(appPkg.main || mainPkg));

  function _findAvailableTasks() {
    /* istanbul ignore else */
    if (!this._start) {
      const taskDirs = util.flattenArgs(this.task_folders || path.join(baseDir, 'tasks'));
      const taskFiles = this._collectTasks(taskDirs, path.join(__dirname, 'bin/tasks'));

      util.extendValues(this._tasks, taskFiles);

      this._start = new Date();
    }
  }

  function _findApplication() {
    const baseName = appPkg.name || path.basename(path.dirname(Grown.cwd));

    const files = [
      `lib/${baseName}/application.js`,
      `lib/${baseName}/server.js`,
      `lib/${baseName}/index.js`,
      `lib/${baseName}/main.js`,
      `lib/${baseName}/app.js`,
      `lib/${baseName}.js`,
      'lib/application.js',
      'lib/server.js',
      'lib/main.js',
      'lib/app.js',
      `${baseName}.js`,
      'application.js',
      'server.js',
      'index.js',
      'main.js',
      'app.js',
    ];

    let mainFile;

    /* istanbul ignore else */
    if (appPkg.main && files.indexOf(appPkg.main) === -1) {
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

    return mainFile;
  }

  function _collectTasks() {
    const dirs = util.flattenArgs(arguments);
    const files = {};

    dirs.forEach(cwd => {
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
    logger.printf('\r{% gray. %s (node %s ─ %s) %}\n', process.name, process.version, process.env.NODE_ENV);

    this._findAvailableTasks();

    /* istanbul ignore else */
    if (taskName && !Grown.argv.flags.help) {
      /* istanbul ignore else */
      if (!Grown.argv.flags.app && taskName === 'up') {
        Grown.argv.flags.app = this._findApplication();
      }

      return logger(taskName, () => {
        return this._exec(Grown.argv.raw, () => this.run(taskName));
      }).catch(e => this._onError(e, taskName));
    }

    logger.write(GROWN_TXT);
  }

  function _showHelp(taskName) {
    if (!taskName) {
      const keys = Object.keys(this._tasks);

      logger.printf('\n  {% gray %s %}\n', keys.length ? 'Tasks:' : 'No tasks found.');

      let maxLength = 0;

      keys.map(x => {
        /* istanbul ignore else */
        if (x.length > maxLength) {
          maxLength = x.length;
        }

        return x;
      }).forEach(x => {
        const task = require(this._tasks[x]);
        const desc = (task.description || '').trim().split('\n')[0];
        const pad = new Array((maxLength + 1) - x.length).join(' ');

        logger.printf('    {% green %s %} %s {% gray # %s %}\n', x, pad, desc);
      });

      logger.printf('\n  {% gray  %s %}\n', ARGV_FLAGS.trim());
    } else {
      if (!this._tasks[taskName]) {
        throw new Error(`Undefined '${taskName}' task`);
      }

      logger.printf('\n  {% green %s %} {% gray ─ %s %}\n', taskName,
        require(this._tasks[taskName]).description.trim());
    }

    logger.write('\n');
  }

  function _onError(e, task) {
    /* istanbul ignore else */
    if (e.errors) {
      e.errors.forEach(err => {
        logger.printf('\r{% exception. %s (%s) %}\n', err.message, err.type);
      });
    }

    /* istanbul ignore else */
    if (!Grown.argv.flags.debug) {
      e = util.cleanError(e, Grown.cwd);
    }

    if (e.original) {
      /* istanbul ignore else */
      if (e.original.detail) {
        logger.printf('\r{% failure. %s %}\n', e.original.detail);
      }

      logger.printf('\r{% failure. %s %}\n', e.original.message);
    }

    const message = (e.stack || e.message).replace(/\b(\w+):/, '($1)');

    if (task) {
      logger.printf('\r{% error. [%s] %s %}\n', task, message);
    } else {
      logger.printf('\r{% error. %s %}\n', message);
    }
    process.exit(1);
  }

  function _onExit(statusCode) {
    /* istanbul ignore else */
    if (!statusCode) {
      logger.printf('\r{% end Done %}\n');
    }

    process.exit(statusCode);
  }

  function _exec(argv, callback, environment) {
    if (typeof callback === 'object') {
      environment = callback;
      callback = undefined;
    }

    return new Promise((resolve, reject) => {
      if (argv.length) {
        const child = spawn(argv[0], argv.slice(1), {
          stdio: 'inherit',
          env: {
            ...process.env,
            ...environment,
          },
        });

        // clear previous logs...
        process.stdout.write('\x1b[K');

        child.on('close', exitCode => {
          if (exitCode !== 0) {
            reject(this._onExit(1));
          } else {
            resolve(callback && callback(exitCode));
          }
        });
      } else {
        resolve(callback && callback());
      }
    });
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
    _start: null,
    _tasks: {},

    start(taskName) {
      /* istanbul ignore next */
      if (!this._start) {
        process.on('unhandledRejection', err => _onError(err));
        process.on('SIGINT', this._onExit);
        process.on('exit', this._onExit);
      }

      return Promise.resolve()
        .then(() => {
          const promise = Grown.CLI._showTasks(taskName);

          /* istanbul ignore else */
          if (!promise) {
            Grown.CLI._showHelp(taskName);
          }

          return promise;
        });
    },

    run(taskName) {
      return Promise.resolve()
        .then(() => {
          this._findAvailableTasks();

          /* istanbul ignore else */
          if (!this._tasks[taskName]) {
            throw new Error(`Task ${taskName} is not registered`);
          }

          try {
            const task = require(this._tasks[taskName]);

            return task.callback(Grown, util);
          } catch (e) {
            _onError(e, taskName);
          }
        });
    },
  });
};
