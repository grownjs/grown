'use strict';

const debug = require('debug')('grown:host');

const errorHandler = require('../util/error');
const connFactory = require('./ctx');

let pid = 0;

module.exports = function $host($, req, res) {
  // normalize
  const host = req.headers.host ? req.headers.host : '';
  const port = host.split(':')[1] || $.globalAgent.defaultPort;
  const hostname = port ? host : `${host}:${$.globalAgent.defaultPort}`;

  debug('Initializing connection for %s %s (%s)',
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

  debug('Instantiating a new connection object');

  if (!_server) {
    debug('Wait. Missing connection object for %s (%s)', hostname, port);
    debug('Available hosts: %s', Object.keys(this._hosts).join(', '));
  }

  // extend built-in factory
  const conn = connFactory(this, _server, req, res);

  conn.pid = pid;

  pid += 1;

  debug('#%s Dispatching connection pipeline', conn.pid);

  /* istanbul ignore else */
  if (conn.res.on) {
    conn.res.on('finish', () => {
      if (!conn.halted) {
        debug('#%s OK. The connection was done', conn.pid);
      }
    });

    conn.res.on('error', e => {
      if (!conn.halted) {
        debug('#%s Fatal. An error was ocurred: %s', conn.pid, e.message);
      }
    });
  }

  this._ctx.dispatch(conn, this._opts)
    .catch(err => errorHandler(err, conn));
};
