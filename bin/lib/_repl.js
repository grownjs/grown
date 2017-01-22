'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const pkg = require('../../package.json');
const _ = require('./_util');

module.exports = ($) => {
  const vm = require('vm');
  const REPL = require('repl');
  const chalk = require('chalk');
  const cleanStack = require('clean-stack');

  const _name = chalk.green(`${pkg.name} v${pkg.version}`);
  const _node = chalk.gray(`node ${process.version}`);

  _.echo(`${_name} ${_node}\n`);

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
        return callback();
      }

      /* istanbul ignore else */
      if (typeof value.then === 'function') {
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
        const parts = value.split(' ');

        let _method = parts.shift() || 'get';
        let _path = parts.shift() || '/';

        if (_method.charAt() === '/') {
          _path = _method;
          _method = 'get';
        }

        if (_path.charAt() !== '/') {
          parts.unshift(_path);
          _path = '/';
        }

        let _value = parts.join(' ');

        try {
          _value = _value.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
        } catch (e) {
          throw new Error(`Invalid expression within '${_value}'. ${e.message}`);
        }

        const _opts = _.requestParams(_value);

        $.fetch(_method, _path, _opts).then((res) => {
          let _status = res.statusCode === 200 ? 'green' : 'cyan';

          if (res.statusCode >= 500) {
            _status = 'red';
          }

          _.echo(chalk[_status](res.statusCode), ' ', chalk.yellow(res.statusMessage), ' ');
          _.echo(chalk.gray(res.body), '\n');
        }).catch((error) => {
          _.echo(chalk.red(error.message), '\n');
        });
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
    value: $,
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
