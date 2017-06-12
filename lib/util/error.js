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

function _errorLayout(conn) {
  return `<!doctype html>
<html>
  <head>
    <title>HTTP ${conn.status_code}</title>
    <style>
      * {
        margin: 0;
        line-height: 1.2;
      }
      p, ul, pre, blockquote, details {
        margin-top: 20px;
      }
      body {
        color: #111111;
        background-color: #E6E6E6;
        font-family: 'Lucida Console', Monaco, monospace;
        padding: 20px;
        font-size: 10pt;
      }
      pre, dd, li {
        overflow: auto;
        word-wrap: break-word;
        word-break: break-word;
        white-space: pre-line;
      }
      dt {
        font-weight: bold;
      }
      dd {
        color: #AAAAAA;
        padding: 0 0 10px 0;
      }
      blockquote pre {
        margin: 10px;
      }
      blockquote {
        border: 3px double #AAAAAA;
      }
      summary {
        cursor: pointer;
        margin-bottom: 10px;
      }
      small { color: #AAAAAA; }
      .wrapper {
        box-shadow: 0px 2px 3px rgba(0, 0, 0, .33);
        background-color: #FBFBFB;
        max-width: 1200px;
        min-width: 200px;
        overflow: hidden;
        padding: 20px;
        margin: auto;
      }
      .call > summary,
      .call > span {
        display: inline-block;
        padding: 10px;
      }
      .call > span {
        background-color: #DDDDDD;
        color: #AAAAAA;
      }
      .call .errored {
        color: white;
        background-color: #FF4136;
      }
      .call > summary {
        background-color: #AAAAAA;
        color: white;
      }
      .call > summary:focus { outline: none; }
      .call ul {
        list-style-type: none;
        padding: 0;
      }
      .call li var { display: block; }
      .call li small { float: right; }
      .call li { margin-bottom: 10px; }
      .call.red dt, .call.red var { color: #FF4136; }
      .call.red[open] summary { background-color: #FF4136; }
      .call.blue dt, .call.blue var { color: #0074D9; }
      .call.blue[open] summary { background-color: #0074D9; }
      .call.green dt, .call.green var { color: #2ECC40; }
      .call.green[open] summary { background-color: #2ECC40; }
      .call.olive dt, .call.olive var { color: #3D9970; }
      .call.olive[open] summary { background-color: #3D9970; }
      .call.maroon dt, .call.maroon var { color: #85144B; }
      .call.maroon[open] summary { background-color: #85144B; }
      .empty {
        background-color: #AAAAAA;
        color: #111111;
        opacity: .5;
      }
      @media screen and (min-width: 30em) {
        summary {
          margin: 0;
        }
        dt {
          float: left;
          clear: left;
          width: 15em;
          text-align: right;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        dd {
          margin: 0 0 0 16em;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">${conn.resp_body}</div>
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
