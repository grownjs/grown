'use strict';

const debug = require('debug')('grown:error');

const _templateError = require('./_err');
const util = require('./string');

const accepts = require('accepts');
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

function _errorLayout(body, status, charset) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="${charset}">
    <title>HTTP ${status}</title>
  </head>
  <body has-error>
    ${body}
  </body>
</html>`;
}

module.exports = function $error(err, conn, options) {
  debug('#%s Error. The connection was failed: %s', conn.pid, err.stack);

  const _accept = accepts(conn.req).type('html', 'json');
  const _err = _fixError(err, options('cwd'));

  let _type;
  let _msg;

  switch (_accept) {
    case 'html':
    default:
      _type = `text/${_accept || 'plain'}`;
      _msg = _templateError({
        env: options('env'),
        type: _accept || 'text',
        error: _err,
        context: conn,
      }, util);
      break;

    case 'json':
      _type = 'application/json';
      _msg = JSON.stringify({
        status: 'error',
        result: _err.message || _err.toString(),
      }, util);
      break;
  }

  // normalize response
  conn.res.setHeader('Content-Type', _type);
  conn.res.statusCode = _err.code;

  return (!conn.is_xhr && _accept === 'html')
    ? _errorLayout(_msg, _err.code, options('charset', 'utf8'))
    : _msg;
};
