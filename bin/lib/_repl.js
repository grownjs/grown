'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const pkg = require('../../package.json');
const _ = require('./_util');

module.exports = ($) => {
  const vm = require('vm');
  const REPL = require('repl');
  const color = require('cli-color');
  const cleanStack = require('clean-stack');

  const _name = color.green(`${pkg.name} v${pkg.version}`);
  const _node = color.blackBright(`node ${process.version}`);
  const _desc = color.blackBright('- type .help to list available commands');

  _.echo(`${_name} ${_node} ${_desc}\n`);

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
        return callback(color.red(cleanStack(e.stack)));
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

          _.echo(color[_status](res.statusCode), ' ', color.yellow(res.statusMessage), ' ');
          _.echo(color.blackBright(res.body), '\n');
        }).catch((error) => {
          _.echo(color.red(error.message), '\n');
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
