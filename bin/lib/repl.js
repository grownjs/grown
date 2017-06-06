'use strict';

/* eslint-disable global-require */

const reInterpolate = /`([^`]+)`/g;

const _ = require('./util');

const path = require('path');
const fs = require('fs');

module.exports = ($, farm) => {
  const vm = require('vm');
  const REPL = require('repl');
  const wargs = require('wargs');

  const logger = farm.logger.getLogger();

  const IS_VERBOSE = $.flags.verbose && $.flags.debug;

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
    replMode: REPL.REPL_MODE_STRICT,
    stdout: process.stdout,
    stdin: process.stdin,
    prompt: '',
    eval(cmd, context, filename, callback) {
      let value;

      try {
        value = vm.runInNewContext(cmd, context);
      } catch (e) {
        logger.info('\r{% error %s %}\r\n', _.getError(e, $.flags));
        repl.displayPrompt();
        return callback();
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
            logger.info('\r{% error %s %}\r\n', _.getError(e, $.flags));
            repl.displayPrompt();
            callback();
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

  Object.defineProperty(repl.context, '$', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: farm.extensions,
  });

  repl.defineCommand('fetch', {
    help: 'Request the current application',
    action(value) {
      const args = wargs(value, {
        booleans: 'crudjtm',
        arrays: 'a',
        aliases: {
          c: 'post',
          r: 'get',
          u: 'put',
          d: 'delete',
          j: 'json',
          t: 'text',
          a: 'attach',
          m: 'multipart',
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
        logger.info("{% error Route not found, given '%s' %}\n", _path);
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
        logger.info("{% error Invalid request, given '%s %s' %}\n", _method, _path);
        return;
      }

      try {
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
        if (args.flags.attach) {
          _opts.attachments = args.flags.attach.map(_value =>
            ({ name: _value.split('=')[0], path: _value.split('=')[1] }));
        }

        /* istanbul ignore else */
        if (args.flags.multipart) {
          args.params['content-type'] = 'multipart/form-data';
        }

        repl.pause();

        logger(`${_method.toUpperCase()} ${_path}`, () =>
          farm.fetch(_path, _method, _opts).then(res => {
            let _status = res.statusCode === 200 ? 'green' : 'cyan';

            /* istanbul ignore else */
            if (res.statusCode >= 500) {
              _status = 'red';
            }

            process.nextTick(() => {
              logger.info('\r{% %s %s %} {% yellow %s %}\r\n',
                _status,
                res.statusCode,
                res.statusMessage);

              Object.keys(res._headers).forEach(key =>
                logger.info('\r{% gray %s: %} %s\r\n',
                  key.replace(/\b([a-z])/g, $0 => $0.toUpperCase()),
                  res._headers[key]));

              logger.info('\n{% gray %s %}\r\n', res.body);

              repl.resume();
              repl.displayPrompt();
            });
          }).catch(e => {
            logger.info('\r{% error %s %}\r\n', _.getError(e, $.flags));

            repl.resume();
            repl.displayPrompt();
          }));
      } catch (_e) {
        logger.info('\r{% error %s %}\r\n', _.getError(_e, $.flags));

        repl.resume();
        repl.displayPrompt();
      }
    },
  });

  repl.defineCommand('reload', {
    help: 'Restart the current session',
    action() {
      farm.emit('reload', repl);
    },
  });

  repl.defineCommand('history', {
    help: 'Show the history',
    action() {
      logger.info('%s\r\n', repl.rli.history.slice().reverse().join('\n'));
      repl.displayPrompt();
    },
  });

  farm.on('done', () => {
    require('log-pose').setLogger(repl.outputStream);

    if (!IS_VERBOSE) {
      repl.setPrompt(require('log-pose/lib/utils.js').style('{% cyan.pointer %}'));
    }

    repl.resume();
    repl.displayPrompt();

    farm.emit('repl', repl);
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
