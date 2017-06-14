'use strict';

const debug = require('debug')('grown:error');

const _templateError = require('./_err');

const cleanStack = require('clean-stack');

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
    summary: e.summary || e.description,
    errors: e.errors || [],
    stack: _stack.split('\n')
      .filter(line => reFile.test(line))
      .join('\n'),
    call: e.pipeline,
    name: e.name || 'Error',
    code: e.statusCode || 500,
  };
}

function _errorLayout(body, status) {
  return `<!doctype html>
<html>
  <head>
    <title>HTTP ${status}</title>
  </head>
  <body has-error>
    ${body}
  </body>
</html>`;
}

module.exports = function $error(err, conn, layout) {
  debug('#%s Error. The connection was failed: %s', conn.pid, err.stack);

  const _accept = conn.accept.type('html', 'json');
  const _err = _fixError(err, conn.get('cwd', process.cwd()));

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
        result: _err.message || _err.toString(),
      });
      break;
  }

  // normalize response
  conn.resp_body = layout
    ? _errorLayout(_msg, _err.code)
    : _msg;

  conn.put_status(_err.code);
  conn.put_resp_header('Content-Type', `${_type}; charset=${conn.resp_charset}`);
  conn.put_resp_header('Content-Length', _msg.length);
};
