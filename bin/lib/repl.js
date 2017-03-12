'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const _ = require('./util');

module.exports = $ => {
  const vm = require('vm');
  const REPL = require('repl');
  const chalk = require('chalk');
  const wargs = require('wargs');
  const cleanStack = require('clean-stack');

  let kill = true;

  const repl = REPL.start({
    stdout: process.stdout,
    stdin: process.stdin,
    prompt: '',
    eval(cmd, context, filename, callback) {
      let value;

      try {
        value = vm.runInNewContext(cmd, context);
      } catch (e) {
        return callback(chalk.red(cleanStack(e.stack)));
      }

      /* istanbul ignore else */
      if (typeof value === 'undefined') {
        return callback(null, undefined);
      }

      /* istanbul ignore else */
      if (value && typeof value.then === 'function') {
        return value
          .then((result) => {
            callback(null, result);
          })
          .catch((error) => {
            callback(cleanStack(error.stack));
          });
      }

      callback(null, value);
    },
  })
  .on('exit', () => {
    /* istanbul ignore else */
    if (kill) {
      _.die();
    }
  });

  /* istanbul ignore else */
  if ($.fetch) {
    repl.defineCommand('fetch', {
      help: 'Request the current application',
      action(value) {
        const args = wargs(value, (v) => {
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
        }

        // variations:
        // /path                 => GET /path
        // <verb> /<path>        => VERB /path
        // /<path> --<verb>      => VERB /path
        // --<verb> /<path>      => VERB /path
        ['put', 'post', 'delete'].forEach((key) => {
          _method = args.flags[key] === true ? key : _method;

          /* istanbul ignore else */
          if (typeof args.flags[key] === 'string') {
            _method = key;
            _path = args.flags[key];
          }
        });

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

          $.fetch(_path, _method, _opts).then((res) => {
            let _status = res.statusCode === 200 ? 'green' : 'cyan';

            if (res.statusCode >= 500) {
              _status = 'red';
            }

            setTimeout(() => {
              _.echo(chalk[_status](res.statusCode), ' ', chalk.yellow(res.statusMessage), ' ');
              _.echo(chalk.gray(res.body), '\n');
            });
          }).catch((error) => {
            _.echo(chalk.red(error.message), '\n');
          });
        } catch (_e) {
          _.echo(chalk.red(_e.message), '\n');
        }
      },
    });
  }

  repl.defineCommand('reload', {
    help: 'Reload the current session',
    action() {
      process.emit('repl:reload');
    },
  });

  Object.defineProperty(repl.context, '$', {
    configurable: false,
    enumerable: false,
    value: $.extensions,
  });

  return () => {
    kill = false;

    /* istanbul ignore else */
    if (repl) {
      repl.close();
    }

    setTimeout(() => {
      kill = true;
    });
  };
};
