'use strict';

const debug = require('debug')('homegrown:host');

const _templateError = require('./_err');
const connFactory = require('./ctx');

const statusCodes = require('http').STATUS_CODES;

// normalize error object
function _fixError(e, cwd) {
  const _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');
  const _short = (e.message || '').split('\n').pop();
  const _error = [_short || e.toString()];

  /* istanbul ignore else */
  if (_stack) {
    _error.push(_stack);
  }

  const lines = _error.map((_msg) => {
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

module.exports = function $host($, req, res) {
  const cwd = this.get('cwd') || process.cwd();

  // normalize
  const host = req.headers.host ? req.headers.host : '';
  const port = host.split(':')[1] || $.globalAgent.defaultPort;
  const hostname = port ? host : `${host}:${$.globalAgent.defaultPort}`;

  debug('Initializing connection for %s (%s)', req.url.split('?')[0], hostname);

  // error handler
  function fail(e) {
    e.pipeline = (e.pipeline || []).concat('host');
    e = _fixError(e, cwd);

    // normalize response
    res.statusCode = e.code;
    res.statusMessage = statusCodes[e.code];

    return e;
  }

  // lookup opened connection
  const _server = this._hosts[hostname]
    || this._hosts[`${hostname}:${port}`]
    || this._hosts[`0.0.0.0:${port}`];

  debug('Instantiating a new connection object');

  // extend built-in factory
  const Conn = this.extensions('Homegrown.conn')(connFactory);
  const conn = Conn.new(this, _server, req, res);

  debug('Dispatching connection pipeline');

  conn.res.on('finish', () => {
    if (!conn.halted) {
      debug('OK. The connection was done');
    }
  });

  conn.res.on('error', (e) => {
    if (!conn.halted) {
      debug('Fatal. An error was ocurred: %s', e.message);
    }
  });

  this.dispatch(conn, this._opts)
    .catch((err) => {
      debug('Error. The connection was failed: %s', err.message);

      const _accept = conn.accept.type('html', 'json');
      const _err = fail(err);

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

      return conn.end()
        .catch((e) => {
          debug('Error. Connection was abruptly interrupted: %s', e.message);

          // fallback response
          res.writeHead(res.statusCode, conn.resp_headers);
          res.write(conn.resp_body);
          res.end();
        });
    });
};
