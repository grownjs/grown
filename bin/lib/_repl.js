'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const _ = require('./_util');

module.exports = ($) => {
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
        console.log(value);


        // const parts = value.split(' ');

        // let _method = parts.shift() || 'get';
        // let _path = parts.shift() || '/';

        // if (_method.charAt() === '-' || _method.indexOf(':') > -1) {
        //   parts.unshift(_method);
        //   _method = 'get';
        // }

        // if (_method.charAt() === '/') {
        //   _path = _method;
        //   _method = 'get';
        // }

        // if (_path.charAt() !== '/') {
        //   parts.unshift(_path);
        //   _path = '/';
        // }

        try {
          // console.log(parts);
          // const _value = parts.join(' ');

          // // allow dynamic value interpolation
          // const _props = wargs(_value, (v) => {
          //   try {
          //     return v.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
          //   } catch (e) {
          //     throw new Error(`Invalid expression within '${v}'. ${e.message}`);
          //   }
          // });

          // if (_props.flags.json) {
          //   _props.params.accept = 'application/json';
          // }

          // if (_props.flags.text) {
          //   _props.params.accept = 'text/plain';
          // }

          // // normalize input
          // const _opts = {
          //   body: _props.data,
          //   headers: _props.params,
          // };

          // $.fetch(_method, _path, _opts).then((res) => {
          //   let _status = res.statusCode === 200 ? 'green' : 'cyan';

          //   if (res.statusCode >= 500) {
          //     _status = 'red';
          //   }

          //   _.echo(chalk[_status](res.statusCode), ' ', chalk.yellow(res.statusMessage), ' ');
          //   _.echo(chalk.gray(res.body), '\n');
          // }).catch((error) => {
          //   _.echo(chalk.red(error.message), '\n');
          // });
        } catch (_e) {
          // _.echo(chalk.red(_e.message), '\n');
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
