'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-rest-params */

const pkg = require('../../package.json');
const _ = require('./_util');

function isRecoverableError(error) {
  /* istanbul ignore else */
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }

  return false;
}

module.exports = ($) => {
  const vm = require('vm');
  const REPL = require('repl');
  const color = require('cli-color');

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
        /* istanbul ignore else */
        if (isRecoverableError(e)) {
          return callback(new REPL.Recoverable(e));
        }

        return callback(color.red(e.stack));
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
            callback(error);
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
        $.fetch(value || '/').then((res) => {
          console.log('DONE');
          _.echo(res.statusCode, '\n');
          _.echo(res.error, '\n');
          _.echo(res.body, '\n');
        }).catch((error) => {
          console.log('ERR');
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

  const _name = color.green(`${pkg.name} v${pkg.version}`);
  const _node = color.blackBright(`node ${process.version}`);
  const _desc = color.blackBright('- type .help to list available commands');

  _.echo(`${_name} ${_node} ${_desc}\n`);

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
