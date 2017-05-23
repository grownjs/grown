'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const _ = require('./util');

const path = require('path');
const fs = require('fs');

module.exports = ($, farm) => {
  const vm = require('vm');
  const REPL = require('repl');
  const chalk = require('chalk');
  const wargs = require('wargs');
  const cleanStack = require('clean-stack');

  let kill = true;

  const logName = ($.flags.repl === true ? 'default' : $.flags.repl) || 'default';

  const logFile = process.env.NODE_REPL_HISTORY
    || path.join(farm.get('cwd', process.cwd()), `log/REPL.${logName}.log`);

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
        return callback();
      }

      /* istanbul ignore else */
      if (value && typeof value.then === 'function') {
        return value
          .then(result => callback(null, result))
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
      /* istanbul ignore else */
      if (fd) {
        fs.closeSync(fd);
      }

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
      /* istanbul ignore else */
      if (ws) {
        ws.write(`${code}\n`);
      }
    } else {
      repl.rli.historyIndex += 1;
      repl.rli.history.pop();
    }
  });

  function print() {
    repl.outputStream.write(Array.prototype.slice.call(arguments).join(''));
  }

  const _logger = {
    ok: msg => print('\r', chalk.green(msg), '\n'),
    log: msg => print('\r', chalk.gray(msg), '\n'),
    fail: msg => print('\r', chalk.red(msg), '\n'),
    write: msg => print(msg),
  };

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
          M: 'multipart',
        },
      }, v => {
        // allow dynamic value interpolation
        try {
          return v.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
        } catch (e) {
          throw new Error(`Invalid expression within '${v}'. ${e.message}`);
        }
      });

      // let _aliased;
      let _method = '';
      let _path = '';

      // variations:
      // alias                 => ...
      // /path                 => GET /path
      // <verb> /<path>        => VERB /path
      // /<path> --<verb>      => VERB /path
      // --<verb> /<path>      => VERB /path
      ['get', 'put', 'post', 'delete'].forEach(key => {
        _method = args.flags[key] === true ? key : _method;

        /* istanbul ignore else */
        if (typeof args.flags[key] === 'string') {
          _method = key;
          _path = args.flags[key];
        }
      });

      /* istanbul ignore else */
      if (!_method && _path.charAt() !== '/') {
        _method = _path;
        _path = args._.shift();
      }

      let _aliased;

      try {
        _aliased = _path && _path.charAt() !== '/'
          ? farm.extensions.routes(_path)
          : null;
      } catch (e) {
        print(chalk.red(`Route not found, given '${_path}'`), '\n');
        return;
      }

      _method = _method || 'get';
      _path = _path || args._.shift() || '/';

      /* istanbul ignore else */
      if (_aliased) {
        _method = _aliased.verb;
        _path = _aliased.path;
      }

      if (['get', 'put', 'post', 'delete'].indexOf(_method) === -1 || _path.charAt() !== '/') {
        print(chalk.red(`Invalid request, given '${_method} ${_path}'`), '\n');
        return;
      }

      try {
        const _start = new Date();

        // normalize input
        const _opts = {
          body: args.data,
          headers: args.params,
        };

        /* istanbul ignore else */
        if (args.flags.text) {
          args.params.accept = 'text/plain';
        }

        /* istanbul ignore else */
        if (args.flags.json) {
          args.params['content-type'] = 'application/json';
          args.params.accept = 'application/json';
        }

        /* istanbul ignore else */
        if (args.flags.multipart) {
          args.params['content-type'] = 'multipart/form-data';
        }

        process.nextTick(() => {
          print(chalk.green(_method.toUpperCase()), ' ', chalk.gray(_path), '\n');

          farm.fetch(_path, _method, _opts).then(res => {
            let _status = res.statusCode === 200 ? 'green' : 'cyan';

            /* istanbul ignore else */
            if (res.statusCode >= 500) {
              _status = 'red';
            }

            process.nextTick(() => {
              print(chalk[_status](res.statusCode),
                ' ', chalk.yellow(res.statusMessage),
                ' ', `${(new Date() - _start) / 1000}ms\n`);

              Object.keys(res._headers).forEach(key =>
                print(chalk.gray(`${key.replace(/\b([a-z])/g, $0 =>
                  $0.toUpperCase())}:`), ' ', res._headers[key], '\n'));

              print('\n', chalk.gray(res.body), '\n');
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
      farm.emit('reload', repl, _logger);
    },
  });

  repl.defineCommand('history', {
    help: 'Show the history',
    action() {
      print(repl.rli.history.slice().reverse().join('\n'), '\n');
    },
  });

  farm.on('done', () => {
    farm.emit('repl', repl, _logger);
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
