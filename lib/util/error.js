'use strict';

const debug = require('debug')('grown:error');

const _templateError = require('./_err');

const cleanStack = require('clean-stack');
const statusCodes = require('http').STATUS_CODES;

const reErrorMessage = /.*Error:.+?\n/;
const reNodeModules = /\/.+?node_modules\//g;
const reNoSpaces = / +at /g;
const reFile = /^\S+\s\(.+?:\d+:\d+\)/;

const reNatives = new RegExp(`^.+(${
  Object.keys(process.binding('natives'))
    .concat('bootstrap_node', 'node')
    .join('|')
})\\.js.+$`, 'gm');

// normalize error object
function _fixError(e, cwd) {
  let _stack = cleanStack(e.stack || '')
    .replace(/^.+(es6-promise|bluebird|internal).+$/gm)
    .replace(reErrorMessage, '')
    .replace(reNatives, '');

  /* istanbul ignore else */
  if (_stack) {
    _stack = _stack.replace(reNoSpaces, '');
    _stack = _stack.replace(reNodeModules, '~');

    while (_stack.indexOf(cwd) > -1) {
      _stack = _stack.replace(cwd, '.');
    }
  }

  return {
    message: e.message || e.toString(),
    errors: e.errors || [],
    debug: e.debug || {},
    stack: _stack.split('\n')
      .filter(line => reFile.test(line))
      .join('\n'),
    call: e.pipeline,
    name: e.name || 'Error',
    code: e.statusCode || 500,
  };
}

function _errorLayout(conn) {
  return `<!doctype html>
<html>
  <head>
    <title>Error!!</title>
  </head>
  <body>
    ${conn.resp_body}
  </body>
</html>`;
}

// error handler
function fail(e, conn) {
  e = _fixError(e, conn.get('cwd', process.cwd()));

  // normalize response
  conn.res.statusCode = e.code;
  conn.res.statusMessage = statusCodes[e.code];

  return e;
}

module.exports = function $error(err, conn) {
  debug('#%s Error. The connection was failed: %s', conn.pid, err.stack);

  const _accept = conn.accept.type('html', 'json');
  const _err = fail(err, conn);

  let _type;
  let _msg;

  switch (_accept) {
    case 'html':
    default:
      _type = `text/${_accept || 'plain'}`;
      _msg = _templateError({
        type: _accept || 'text',
        error: _err,
        context: conn,
      });
      break;

    case 'json':
      _type = 'application/json';
      _msg = JSON.stringify({
        status: 'error',
        message: _err,
      });
      break;
  }

  conn.resp_body = _msg;
  conn.put_status(_err.code);
  conn.put_resp_header('Content-Type', `${_type}; charset=${conn.resp_charset}`);
  conn.put_resp_header('Content-Length', _msg.length);

  return conn.end()
    .catch(e => {
      debug('#%s Error. Connection was abruptly interrupted: %s', conn.pid, e.message);

      try {
        /* istanbul ignore else */
        if (!conn.res.finished) {
          /* istanbul ignore else */
          if (_type === 'text/html') {
            conn.resp_body = _errorLayout(conn);
            conn.put_resp_header('Content-Length', conn.resp_body.length);
          }

          conn.res.writeHead(conn.res.statusCode, conn.resp_headers);
          conn.res.write(conn.resp_body);
          conn.res.end();
        } else {
          debug('#%s Response already sent.', conn.pid);
        }
      } catch (_e) {
        debug('#%s Fatal. %s', conn.pid, _e.message);
      }
    });
};
