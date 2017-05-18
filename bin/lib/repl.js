'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const _ = require('./util');

const path = require('path');
const fs = require('fs');

module.exports = ($, cwd, farm) => {
  const vm = require('vm');
  const REPL = require('repl');
  const chalk = require('chalk');
  const wargs = require('wargs');
  const cleanStack = require('clean-stack');

  let kill = true;

  const logName = ($.flags.repl === true ? 'default' : $.flags.repl) || 'default';
  const logFile = process.env.NODE_REPL_HISTORY || path.join(cwd, `log/REPL.${logName}.log`);

  const fd = fs.openSync(logFile, 'a');

  const wstream = fs.createWriteStream(logFile, { fd });

  wstream.on('error', err => {
    throw err;
  });

  const repl = REPL.start({
    stdout: process.stdout,
    stdin: process.stdin,
    prompt: '',
    eval(cmd, context, filename, callback) {
      let value;

      try {
        value = vm.runInNewContext(cmd, context);
      } catch (e) {
        return callback(chalk.red(($.flags.debug && cleanStack(e.stack)) || e.message || e.toString()));
      }

      /* istanbul ignore else */
      if (typeof value === 'undefined') {
        return callback(null, undefined);
      }

      /* istanbul ignore else */
      if (value && typeof value.then === 'function') {
        return value
          .then(result => {
            callback(null, result);
          })
          .catch(e => {
            callback(chalk.red(($.flags.debug && cleanStack(e.stack)) || e.message || e.toString()));
          });
      }

      callback(null, value);
    },
  })
  .on('exit', () => {
    /* istanbul ignore else */
    if (kill) {
      fs.closeSync(fd);
      _.die();
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
      wstream.write(`${code}\n`);
    } else {
      repl.rli.historyIndex += 1;
      repl.rli.history.pop();
    }
  });

  function print() {
    repl.outputStream.write(Array.prototype.slice.call(arguments).join(''));
  }

  Object.defineProperty(repl.context, 'Grown', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: farm.extensions,
  });

  repl.defineCommand('fetch', {
    help: 'Request the current application',
    action(value) {
      const args = wargs(value, {
        booleans: 'CRUDJT',
        aliases: {
          C: 'post',
          R: 'get',
          U: 'put',
          D: 'delete',
          J: 'json',
          T: 'text',
        },
      }, v => {
        // allow dynamic value interpolation
        try {
          return v.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
        } catch (e) {
          throw new Error(`Invalid expression within '${v}'. ${e.message}`);
        }
      });

      let _method = 'get';
      let _path = args._.shift();

      /* istanbul ignore else */
      if (_path && _path.charAt() !== '/') {
        _method = _path;
        _path = args._.shift();

        const _aliased = farm.extensions.routes(_method);

        /* istanbul ignore else */
        if (_aliased) {
          _method = _aliased.verb;
          _path = _aliased.path;
        }
      }

      // variations:
      // alias                 => ...
      // /path                 => GET /path
      // <verb> /<path>        => VERB /path
      // /<path> --<verb>      => VERB /path
      // --<verb> /<path>      => VERB /path
      ['put', 'post', 'delete'].forEach(key => {
        _method = args.flags[key] === true ? key : _method;

        /* istanbul ignore else */
        if (typeof args.flags[key] === 'string') {
          _method = key;
          _path = args.flags[key];
        }
      });

      // normalize initial path
      _path = _path || '/';

      if (['get', 'put', 'post', 'delete'].indexOf(_method) === -1 || _path.charAt() !== '/') {
        print(chalk.red(`Invalid request, given '${_method} ${_path}'`), '\n');
        return;
      }

      try {
        if (args.flags.json) {
          args.params.accept = 'application/json';
        }

        if (args.flags.text) {
          args.params.accept = 'text/plain';
        }

        // normalize input
        const _opts = {
          body: args.data,
          headers: args.params,
        };

        const _start = new Date();

        print(chalk.green(_method.toUpperCase()), ' ', chalk.gray(_path), '\n');

        process.nextTick(() => {
          farm.fetch(_path, _method, _opts).then(res => {
            let _status = res.statusCode === 200 ? 'green' : 'cyan';

            if (res.statusCode >= 500) {
              _status = 'red';
            }

            process.nextTick(() => {
              print(chalk[_status](res.statusCode), ' ', chalk.yellow(res.statusMessage), ' ',
                `${(new Date() - _start) / 1000}ms ${res.body ? res.body.length : -1} `);
              print(chalk.gray(res.body), '\n');
            });
          }).catch(e => {
            print(chalk.red(($.flags.debug && cleanStack(e.stack)) || e.message || e.toString()), '\n');
          });
        });
      } catch (_e) {
        print(chalk.red(($.flags.debug && cleanStack(_e.stack)) || _e.message || _e.toString()), '\n');
      }
    },
  });

  repl.defineCommand('reload', {
    help: 'Restart the current session',
    action() {
      process.emit('repl:reload');
    },
  });

  repl.defineCommand('history', {
    help: 'Show the history',
    action() {
      print(repl.rli.history.slice().reverse().join('\n'), '\n');
    },
  });

  farm.on('done', () => {
    farm.emit('repl', repl, {
      ok: msg => print('\r', chalk.green(msg), '\n'),
      log: msg => print('\r', chalk.gray(msg), '\n'),
      fail: msg => print('\r', chalk.red(msg), '\n'),
      write: msg => print(msg),
    });

    repl.resume();
  });

  return () => {
    kill = false;

    /* istanbul ignore else */
    if (repl) {
      repl.close();
    }

    process.nextTick(() => {
      kill = true;
    });
  };
};
