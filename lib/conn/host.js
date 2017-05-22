'use strict';

const debug = require('debug')('grown:host');

const errorHandler = require('../util/error');
const connFactory = require('./ctx');

let pid = 0;

module.exports = function $host($, req, res) {
  pid += 1;

  const PID = `${process.pid}.${pid}`;

  // normalize
  const host = req.headers.host ? req.headers.host : '';
  const port = host.split(':')[1] || $.globalAgent.defaultPort;
  const hostname = port ? host : `${host}:${$.globalAgent.defaultPort}`;

  debug('#%s Initializing connection for %s %s (%s)',
    PID,
    req.method.toUpperCase(),
    req.url.split('?')[0],
    hostname);

  // FIXME: heroku always reports 80
  const _port = process.env.PORT || 8080;
  const _host = process.env.HOST || '0.0.0.0';

  // lookup opened connection
  const _server = this._hosts[hostname] || this._hosts[`${hostname}:${port}`]
    || this._hosts[`0.0.0.0:${port}`] || this._hosts[`${_host}:${_port}`]
    || this._hosts[_host];

  debug('#%s Instantiating a new connection object', PID);

  if (!_server) {
    debug('#%s Wait. Missing connection object for %s (%s)', PID, hostname, port);
    debug('#%s Available hosts: %s', PID, Object.keys(this._hosts).join(', '));
  }

  // extend built-in factory
  const conn = connFactory(this, _server, req, res);

  Object.defineProperty(conn, 'pid', {
    configurable: false,
    enumerable: true,
    get: () => PID,
  });

  debug('#%s Dispatching connection pipeline', PID);

  /* istanbul ignore else */
  if (conn.res.on) {
    conn.res.on('finish', () => {
      if (!conn.halted) {
        debug('#%s OK. The connection was done', PID);
      }
    });

    conn.res.on('error', e => {
      if (!conn.halted) {
        debug('#%s Fatal. An error was ocurred: %s', PID, e.message);
      }
    });
  }

  this._ctx.dispatch(conn, this._opts)
    .catch(err => errorHandler(err, conn));
};
