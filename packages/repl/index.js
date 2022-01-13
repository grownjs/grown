'use strict';

const wargs = require('wargs');
const path = require('path');
const fs = require('fs');

module.exports = (Grown, util) => {
  const logDir = path.join(Grown.cwd, 'logs');

  /* istanbul ignore else */
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logFile = process.env.NODE_REPL_HISTORY
    || path.join(logDir, `REPL.${this.logName || 'default'}.log`);

  const Logger = require('log-pose');
  const _utils = require('log-pose/lib/utils.js');

  const REPL = require('repl');

  function _initializeContext(target) {
    util.readOnlyProperty(target, '$', () => Grown);
  }

  function _startREPL() {
    let fd;
    let ws;

    try {
      fd = fs.openSync(logFile, 'a');
      ws = fs.createWriteStream(logFile, { fd });

      ws.on('error', err => {
        throw err;
      });
    } catch (e) {
      // do nothing
    }

    const repl = REPL.start({
      replMode: REPL.REPL_MODE_STRICT,
      stdout: process.stdout,
      stdin: process.stdin,
      eval: this._runCMD,
      prompt: '',
    });

    repl.on('reset', this._initializeContext);
    this._initializeContext(repl.context);

    Logger
      .setLevel('info')
      .setLogger(repl.outputStream);

    repl.on('exit', () => {
      /* istanbul ignore else */
      if (fd) {
        fs.closeSync(fd);
      }
      process.exit();
    });

    repl.pause();

    try {
      repl.history = fs.readFileSync(logFile, 'utf-8').split('\n').reverse();
      repl.history.shift();
      repl.historyIndex = -1;
    } catch (e) {
      // do nothing
    }

    repl.addListener('line', code => {
      if (code && code !== '.history') {
        if (ws && repl.history[1] !== code) {
          ws.write(`${code}\n`);
        }
      } else {
        repl.historyIndex += 1;
        repl.history.pop();
      }
    });

    repl.defineCommand('history', {
      help: 'Show the history',
      action() {
        Logger.getLogger().write(repl.history.slice().reverse().join('\n'));
        repl.displayPrompt();
      },
    });

    repl.defineCommand('prune', {
      help: 'Delete the history and clear the active log',
      action() {
        process.nextTick(() => {
          fs.writeFileSync(logFile, '');
        });

        repl.history = [];
        repl.displayPrompt();
      },
    });

    return repl;
  }

  function _runCMD(cmd, context, filename, callback) {
    Promise.resolve()
      .then(() => util.invoke(cmd.includes('await') ? `(async () => {return(\n${cmd}\n)})();` : cmd, context))
      .then(value => {
        /* istanbul ignore else */
        if (typeof value === 'undefined') {
          callback();
          return;
        }

        /* istanbul ignore else */
        if (value && typeof value.then === 'function') {
          return value.then(result => {
            callback(null, result);
          });
        }

        callback(null, value);
      })
      .catch(e => {
        /* istanbul ignore else */
        if (!Grown.argv.flags.debug) {
          e = util.cleanError(e, Grown.cwd);
        }

        Logger.getLogger().info('\r{% error. %s %}\n', e.stack || e.message);
        callback();
      });
  }

  return Grown('REPL', {
    _initializeContext,
    _startREPL,
    _runCMD,

    // shared
    _cmds: {},

    add(cmd, desc, callback) {
      /* istanbul ignore else */
      if (typeof desc === 'object') {
        callback = desc.callback || callback;
        desc = desc.description;
      }

      if (typeof cmd === 'object') {
        util.extend(this._cmds, cmd);
      } else {
        this._cmds[cmd] = {
          description: desc,
          callback,
        };
      }
    },

    start() {
      const repl = this._startREPL();
      const cbs = [];

      util.readOnlyProperty(this, 'repl', repl);

      const hooks = Object.keys(Grown.argv.params);

      hooks.forEach(x => {
        /* istanbul ignore else */
        if (!this._cmds[x] || typeof this._cmds[x].callback !== 'function') {
          throw new Error(`Missing hook '${x}'`);
        }

        cbs[x === 'import' ? 'unshift' : 'push'](this._cmds[x].callback);
      });

      const logger = Logger.getLogger()
        .info('\r{% log. Loading %s... %}', hooks.join(', '));

      // FIXME: enable extensions?
      const ctx = {
        logger,
        repl,
      };

      function onError(e) {
        /* istanbul ignore else */
        if (e.errors) {
          e.errors.forEach(err => {
            logger.info('\r{% exception. %s (%s) %}\n', err.message, err.type);
          });
        }

        /* istanbul ignore else */
        if (e.original) {
          logger.info('\r{% failure. %s %}\n', e.original.detail);
          logger.info('\r{% failure. %s %}\n', e.original.message);
        }

        /* istanbul ignore else */
        if (!Grown.argv.flags.debug) {
          e = util.cleanError(e, Grown.cwd);
        }

        logger.info('\r{% error. %s %}\n', e.stack || e.message);
      }

      Object.keys(this._cmds).forEach(cmd => {
        const fn = this._cmds[cmd].callback;

        /* istanbul ignore else */
        if (!fn || typeof fn !== 'function') {
          throw new Error(`Invalid callback for ${cmd}, given '${util.inspect(this._cmds[cmd])}'`);
        }

        /* istanbul ignore else */
        if (!this._cmds[cmd].description) {
          throw new Error(`Missing description for ${cmd}, given '${util.inspect(this._cmds[cmd])}'`);
        }

        repl.defineCommand(cmd, {
          help: this._cmds[cmd].description,
          action(value) {
            util.extend(ctx, wargs(value));
            repl.pause();

            Promise.resolve()
              .then(() => fn.call(null, ctx, util))
              .catch(onError)
              .then(() => {
                repl.resume();
                repl.displayPrompt();
              });
          },
        });
      });

      return Promise.resolve()
        .then(() => cbs.reduce((prev, cb) => prev.then(() => cb && cb.call(null, ctx, util)), Promise.resolve()))
        .then(() => {
          const load = util.flattenArgs(Grown.argv.flags.load).filter(Boolean);

          if (load.length > 0) {
            load.forEach(x => repl.commands.load.action.call(repl, x));
          }

          repl.setPrompt(_utils.style('{% gray.pointer %}'));
        })
        .then(() => {
          logger.info('\r{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');

          repl.resume();

          setTimeout(() => {
            repl.displayPrompt();
          });
        })
        .catch(e => {
          onError(e);
          process.exit(1);
        });
    },
  });
};
