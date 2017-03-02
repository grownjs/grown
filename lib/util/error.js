'use strict';

const debug = require('debug')('grown:error');

const _templateError = require('./_err');

const cleanStack = require('clean-stack');
const statusCodes = require('http').STATUS_CODES;

const reErrorMessage = /.*Error:.+?\n/;
const reNodeModules = /\/.+?node_modules\//g;
const reNoSpaces = / +at /g;

// normalize error object
function _fixError(e, cwd) {
  const _stack = (e.stack || '').replace(reErrorMessage, '');
  const _short = (e.message || '').split('\n').pop();
  const _error = [_short || e.toString()];

  /* istanbul ignore else */
  if (_stack) {
    _error.push(cleanStack(_stack).replace(reNoSpaces, ''));
  }

  const lines = _error.map((_msg) => {
    _msg = _msg.replace(reNodeModules, '~');

    while (_msg.indexOf(cwd) > -1) {
      _msg = _msg.replace(cwd, '.');
    }

    return _msg;
  });

  return {
    errors: e.errors || [],
    debug: e.debug || {},
    stack: lines.pop(),
    body: lines,
    name: e.name || 'Error',
    code: e.statusCode || 500,
    call: `<= ${e.pipeline.join(' <= ')}`,
  };
}

// error handler
function fail(e, cwd, conn) {
  e.pipeline = (e.pipeline || []).concat('host');
  e = _fixError(e, cwd);

  // normalize response
  conn.res.statusCode = e.code;
  conn.res.statusMessage = statusCodes[e.code];

  return e;
}

module.exports = function $error(err, conn) {
  debug('Error. The connection was failed: %s', err.message);

  const _accept = conn.accept.type('html', 'json');
  const _err = fail(err, conn.get('cwd'), conn);

  let _type;
  let _msg;

  switch (_accept) {
    case 'html':
    default:
      _type = `text/${_accept || 'plain'}`;
      _msg = _templateError({
        type: _accept,
        error: _err,
        params: conn.params,
        handler: conn.handler,
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
  conn.put_resp_header('Content-Length', _msg.length.toString());

  return conn.end()
    .catch((e) => {
      debug('Error. Connection was abruptly interrupted: %s', e.stack);

      // fallback response
      conn.res.writeHead(conn.res.statusCode, conn.resp_headers);
      conn.res.write(conn.resp_body);
      conn.res.end();
    });
};
