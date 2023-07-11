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
const flev = require('fastest-levenshtein');
const jsyaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');

module.exports = (Grown, util) => {
  Grown.use(require('@grown/logger'));

  const logger = util.getLogger();

  const mainPkg = path.join(Grown.cwd, 'package.json');
  const appPkg = (fs.existsSync(mainPkg) && require(mainPkg)) || {};
  const baseDir = path.resolve(Grown.cwd, path.dirname(appPkg.main || mainPkg));

  // ASYNC
  async function _findAvailableTasks() {
    /* istanbul ignore else */
    if (!this._start) {
      const taskDirs = util.flattenArgs(this.task_folders || path.join(baseDir, 'tasks'));
      const taskFiles = this._collectTasks(taskDirs, path.join(__dirname, 'bin/tasks'));

      this._start = new Date();

      this._defined.forEach(([task, desc, cb]) => {
        this._tasks[task] = { module: { description: desc, callback: cb } };

        for (let i = 1; i <= task.length; i += 1) {
          /* istanbul ignore else */
          if (!this._alias[task.substr(0, i)]) this._alias[task.substr(0, i)] = task;
        }
      });

      return Promise.all(Object.entries(taskFiles)
        .map(([task, filepath]) => util.load(filepath)
          .then(extension => {
            this._tasks[task] = { filepath, module: extension };

            const fn = this._tasks[task].module.configure;

            /* istanbul ignore else */
            if (typeof fn === 'function') fn(Grown, util);

            for (let i = 1; i <= task.length; i += 1) {
              /* istanbul ignore else */
              if (!this._alias[task.substr(0, i)]) this._alias[task.substr(0, i)] = task;
            }
          })));
    }
  }

  function _findApplication() {
    const files = [
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
    const skip = Grown.CLI.disable_tasks || [];
    const dirs = util.flattenArgs(arguments);
    const files = {};

    dirs.forEach(cwd => {
      /* istanbul ignore else */
      if (fs.existsSync(cwd)) {
        fs.readdirSync(cwd)
          .filter(x => x.indexOf('.js') > -1)
          .forEach(x => {
            const key = x.replace('.js', '');

            /* istanbul ignore else */
            if (!skip.includes(key)) {
              files[key] = path.join(cwd, x);
            }
          });
      }
    });

    return files;
  }

  function _showTasks(taskName) {
    if (!process.silent) {
      logger.printf('\r{% gray. %s (node %s ─ %s) %}\n', process.name, process.version, process.env.NODE_ENV);
    }

    /* istanbul ignore else */
    if (taskName && !Grown.argv.flags.help) {
      /* istanbul ignore else */
      if (!Grown.argv.flags.app && taskName === 'server') {
        process.main = process.main || this._findApplication();
      }

      return Promise.resolve()
        .then(() => (process.silent ? this.run(taskName) : logger(taskName, () => this.run(taskName))))
        .catch(e => this._onError(e, taskName));
    }

    if (this.banner_text !== false) {
      logger.write(this.banner_text || GROWN_TXT);
    }
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
        const task = this._tasks[x].module;
        const desc = (task.description || '').trim().split('\n')[0];
        const pad = new Array((maxLength + 1) - x.length).join(' ');

        logger.printf('    {% green %s %} %s {% gray # %s %}\n', x, pad, desc);
      });

      logger.printf('\n  {% gray  %s %}\n', ARGV_FLAGS.trim());
    } else {
      /* istanbul ignore else */
      if (!this._tasks[taskName]) {
        const alias = flev.closest(taskName, Object.keys(this._alias));

        throw new Error(`Unknown '${taskName}' task${alias ? `, did you mean '${alias}'?` : ''}`);
      }

      let usageInfo = this._tasks[taskName].module.description;
      usageInfo = usageInfo.replace(/{bin}/g, this.command_name || 'grown');

      /* istanbul ignore else */
      if (this.subtasks(taskName)) {
        const tasks = this.subtasks(taskName);
        const keys = Object.keys(tasks);
        const max = keys.reduce((memo, cur) => {
          /* istanbul ignore else */
          if (cur.length > memo) return cur.length;
          return memo;
        }, 0);

        /* istanbul ignore else */
        if (Grown.argv._[1] && !keys.includes(Grown.argv._[1])) {
          const alias = flev.closest(Grown.argv._[1], keys);

          throw new Error(`Unknown '${Grown.argv._[1]}' subtask${alias ? `, did you mean '${alias}'?` : ''}`);
        }

        if (keys.includes(Grown.argv._[1]) && tasks[Grown.argv._[1]].usage) {
          usageInfo = tasks[Grown.argv._[1]].usage.replace(/{bin}/g, this.command_name || 'grown');
          logger.printf('\n  {% green %s %} %s {% gray ─ %s %}\n', taskName, Grown.argv._[1], usageInfo.trim());
        } else {
          const genInfo = keys.reduce((memo, key) => {
            memo.push(`${`${key}          `.substr(0, max + 2)} # ${tasks[key].usage.trim().split('\n')[0].trim()}`);
            return memo;
          }, []);

          usageInfo = usageInfo.replace('__HOOKS__\n', `${genInfo.join('\n    ')}\n`);

          logger.printf('\n  {% green %s %} {% gray ─ %s %}\n', taskName, usageInfo.trim());
        }
      } else {
        logger.printf('\n  {% green %s %} {% gray ─ %s %}\n', taskName, usageInfo.trim());
      }
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

    /* istanbul ignore else */
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

  const _ = {
    status(color, kind, value) {
      logger.printf('\r{% %s. %s %} %s\n', color, kind, value || '');
      return logger;
    },

    remove(filepath) {
      fs.removeSync(filepath);

      let curDir = path.dirname(filepath);
      while (!fs.readdirSync(curDir).length) {
        fs.rmdirSync(curDir);
        curDir = path.dirname(curDir);
        if (curDir.charAt() === '.') break;
      }

      logger.printf('\r{% redBright remove %} %s\n', path.relative('.', filepath));
    },

    write(filepath, content) {
      fs.outputFileSync(filepath, content);
      logger.printf('\r{% cyan write %} %s\n', path.relative('.', filepath));
    },

    parse(filepath) {
      if (!(filepath.includes('.yml') || filepath.includes('.json'))) {
        throw new Error(`Expecting .yml or .json file, given '${filepath}'`);
      }

      const parts = filepath.replace(/\.\w+$/, '').split('/');

      let key;
      while (parts.length > 0) {
        key = parts.pop();
        if (/[A-Z]/.test(key)) break;
      }

      const ok = fs.existsSync(filepath);
      const text = ok ? fs.readFileSync(filepath).toString() : '';

      let target;
      let yaml;
      if (filepath.includes('.yml')) {
        yaml = true;
        target = text.trim() ? jsyaml.load(text.replace(/ !include /g, ' include ')) : {};
      } else {
        target = text.trim() ? JSON.parse(text) : {};
      }

      function remove(prop) {
        const keys = prop.split('/');

        try {
          let obj = target;
          while (keys.length > 1) {
            obj = obj[keys.shift()];
          }

          if (Array.isArray(obj)) {
            obj.splice(keys.shift(), 1);
          } else {
            delete obj[keys.shift()];
          }
        } catch (e) {
          throw new Error(`Definition for '${prop}' not found`);
        }
      }

      function serialize() {
        return yaml
          ? jsyaml.dump(target).trim().replace(/: include /g, ': !include ')
          : JSON.stringify(target, null, 2);
      }

      return {
        ok, key, yaml, target, remove, serialize,
      };
    },
  };

  return Grown('CLI', {
    _findAvailableTasks,
    _findApplication,
    _collectTasks,
    _showTasks,
    _showHelp,
    _onError,
    _onExit,
    _exec,
    _,

    // shared
    _task: null,
    _start: null,
    _alias: {},
    _tasks: {},
    _groups: {},
    _defined: [],

    subtasks(group) {
      return this._groups[group];
    },

    define(type, usage, callback) {
      if (type.includes(':')) {
        const [group, kind] = type.split(':');

        this._groups[group] = this._groups[group] || {};
        this._groups[group][kind] = { usage, callback };
      } else {
        this._defined.push([type, usage, callback]);
      }
    },

    start(taskName) {
      /* istanbul ignore next */
      if (!this._start) {
        process.on('unhandledRejection', err => this._onError(err));
        process.on('uncaughtException', err => this._onError(err));
        process.on('SIGINT', this._onExit);
        process.on('exit', this._onExit);
      }

      return Promise.resolve()
        .then(() => this._findAvailableTasks())
        .then(() => {
          taskName = this._alias[taskName] || taskName;

          const promise = Grown.CLI._showTasks(taskName);

          /* istanbul ignore else */
          if (!promise) {
            Grown.CLI._showHelp(taskName);
          }

          /* istanbul ignore else */
          if (Grown.argv.raw.length > 0 && promise) {
            promise.then(() => {
              this._exec(Grown.argv.raw).catch(e => this._onError(e, taskName));
            });
          }

          return promise;
        });
    },

    run(taskName) {
      return Promise.resolve()
        .then(() => this._findAvailableTasks())
        .then(() => {
          taskName = this._alias[taskName] || taskName;

          /* istanbul ignore else */
          if (!this._tasks[taskName]) {
            throw new Error(`Task ${taskName} is not registered`);
          }

          this._task = taskName;

          const task = this._tasks[taskName].module;

          /* istanbul ignore else */
          if (this.command_line) {
            Object.assign(Grown.argv, this.command_line);
          }

          return task.callback(Grown, util);
        })
        .catch(e => {
          this._onError(e, taskName);
        });
    },
  });
};
