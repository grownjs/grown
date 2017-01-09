/* eslint-disable global-require */

import { name, version } from '../../package.json';

const die = statusCode => process.exit(statusCode);
const echo = (...msg) => process.stdout.write(`${msg.join('')}`);

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }

  return false;
}

export default () => {
  const vm = require('vm');
  const REPL = require('repl');
  const color = require('cli-color');

  return ($) => {
    let kill = true;
    let repl;

    $.initializers.push(() => {
      repl = REPL.start({
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
          die();
        }
      });

      repl.defineCommand('reload', {
        help: 'Reload the current session',
        action() {
          process.emit('repl:reload');
        },
      });

      Object.defineProperty(repl.context, '$', {
        configurable: false,
        enumerable: true,
        value: $,
      });

      const _name = color.green(`${name} v${version}`);
      const _desc = color.blackBright('- type .help to list available commands');

      echo(`${_name} ${_desc}\n`);
    });

    $.finalizers.push(() => {
      kill = false;

      /* istanbul ignore else */
      if (repl) {
        repl.close();
      }

      setTimeout(() => {
        kill = true;
      });
    });
  };
};
