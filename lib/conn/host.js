'use strict';

const debug = require('debug')('grown:host');

const errorHandler = require('../util/error');
const connFactory = require('./ctx');

let pid = 0;

module.exports = function $host($, req, res) {
  const PID = `${process.pid}.${pid}`;

  pid += 1;

  // normalize
  const host = req.headers.host ? req.headers.host : '';
  const port = host.split(':')[1] || $.globalAgent.defaultPort;
  const hostname = port ? host : `${host}:${$.globalAgent.defaultPort}`;

  debug('#%s (%s) %s %s',
    PID,
    hostname,
    req.method.toUpperCase(),
    req.url.split('?')[0]);

  // FIXME: heroku always reports 80
  const _port = port || process.env.PORT || 8080;
  const _host = host || process.env.HOST || '0.0.0.0';

  // lookup opened connection
  const _server = this._hosts[hostname]
    || this._hosts[`${_host}:${_port}`]
    || this._hosts[`0.0.0.0:${_port}`]
    || this._hosts['0.0.0.0']
    || this._hosts[_host]
    || this._hosts[port];

  /* istanbul ignore else */
  if (!_server) {
    debug('Wait. Missing connection object for %s (%s)', hostname, port);
  }

  // extend built-in factory
  const conn = connFactory(this, _server, req, res);

  Object.defineProperty(conn, 'pid', {
    configurable: false,
    enumerable: true,
    get: () => PID,
  });

  /* istanbul ignore else */
  if (conn.res.on) {
    conn.res.on('finish', () => {
      /* istanbul ignore else */
      if (!conn.halted) {
        debug('#%s OK. The connection was done', PID);
      }
    });

    conn.res.on('error', e => {
      /* istanbul ignore else */
      if (!conn.halted) {
        debug('#%s Fatal. An error was ocurred: %s', PID, e.message);
      }
    });
  }

  this._ctx.dispatch(conn, this._opts)
    .catch(err => errorHandler(err, conn));
};
