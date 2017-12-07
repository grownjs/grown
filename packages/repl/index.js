'use strict';

const path = require('path');
const fs = require('fs');

module.exports = (Grown, util) => {
  const _logger = require('log-pose');
  const _utils = require('log-pose/lib/utils.js');

  const REPL = require('repl');

  function _initializeContext(target) {
    util.readOnlyProperty(target, 'Grown', () => Grown);
  }

  function _startREPL() {
    const logDir = path.join(Grown.cwd, 'logs');

    /* istanbul ignore else */
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const logFile = process.env.NODE_REPL_HISTORY
      || path.join(logDir, `REPL.${this.logName || 'default'}.log`);

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

    _logger
      .setLevel('info')
      .setLogger(repl.outputStream);

    repl.on('exit', () => {
      /* istanbul ignore else */
      if (fd) {
        fs.closeSync(fd);
      }
    });

    repl.pause();

    try {
      repl.rli.history = fs.readFileSync(logFile, 'utf-8').split('\n').reverse();
      repl.rli.history.shift();
      repl.rli.historyIndex = -1;
    } catch (e) {
      // do nothing
    }

    repl.rli.addListener('line', code => {
      if (code && code !== '.history') {
        /* istanbul ignore else */
        if (ws && repl.rli.history.indexOf(code, 1) === -1) {
          ws.write(`${code}\n`);
        }
      } else {
        repl.rli.historyIndex += 1;
        repl.rli.history.pop();
      }
    });

    repl.defineCommand('history', {
      help: 'Show the history',
      action() {
        _logger.getLogger().write(repl.rli.history.slice().reverse().join('\n'));
        repl.displayPrompt();
      },
    });

    return repl;
  }

  function _runCMD(cmd, context, filename, callback) {
    let value;

    try {
      value = util.invoke(cmd, context);
    } catch (e) {
      _logger.getLogger().info('\r{% error %s %}\r\n', e.message);
      callback();
      return;
    }

    /* istanbul ignore else */
    if (typeof value === 'undefined') {
      callback();
      return;
    }

    /* istanbul ignore else */
    if (value && typeof value.then === 'function') {
      return value
        .then(result => {
          callback(null, result);
        })
        .catch(e => {
          /* istanbul ignore else */
          if (e) {
            _logger.getLogger().info('\r{% error %s %}\r\n', e.message);
          }

          callback(e || new Error(`Did not '${cmd}' failed?`));
        });
    }

    callback(null, value);
  }

  return Grown.module('REPL', {
    _initializeContext,
    _startREPL,
    _runCMD,

    start() {
      const tasks = util.flattenArgs(arguments);
      const repl = this._startREPL();
      const cbs = [];

      util.readOnlyProperty(this, 'repl', repl);

      repl.setPrompt(_utils.style('{% cyan.pointer %}'));

      const use = (Grown.argv.params.use || '').split(',');

      tasks.forEach(task => {
        Object.keys(task).forEach(key => {
          if (use.indexOf(key) !== -1) {
            cbs.push(task[key]);
          }
        });
      });

      _logger.getLogger()
        .info('{% gray Grown v%s (node %s) %}\n', Grown.version, process.version)
        .info('\r{% log Loading %s... %}', use.join(','));

      return Promise.resolve()
        .then(() => Promise.all(cbs.map(cb => cb && cb())))
        .then(() => {
          _logger.getLogger()
            .info('\r{% ok NODE_ENV is %s %}\r\n', Grown.env)
            .info('{% ok REPL is ready %}\n')
            .info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');

          repl.resume();
          repl.displayPrompt();
        })
        .catch(e => {
          _logger.getLogger().info('\r{% error %s %}\r\n', e.stack);
        });
    },
  });
};
