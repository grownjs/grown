'use strict';

const debug = require('debug')('grown:listen');

module.exports = function $host(_protocol, req, res) {
  // normalize
  const host = req.headers.host ? req.headers.host : '';
  const port = host.split(':')[1] || _protocol.globalAgent.defaultPort;
  const hostname = port ? host : `${host}:${_protocol.globalAgent.defaultPort}`;

  debug('#%s (%s) %s %s',
    process.pid,
    hostname,
    req.method.toUpperCase(),
    req.url.split('?')[0]);

  // FIXME: heroku always reports 80
  const _port = port || process.env.PORT || '8080';
  const _host = host || process.env.HOST || '0.0.0.0';

  // lookup opened connection
  let _server = this._hosts[hostname]
    || this._hosts[`${_host}:${_port}`]
    || this._hosts[`0.0.0.0:${_port}`]
    || this._hosts['0.0.0.0']
    || this._hosts[_host]
    || this._hosts[port];

  /* istanbul ignore else */
  if (!_server) {
    debug('#%s Wait. Missing connection for %s (%s)', process.pid, hostname, port);

    try {
      // fallback
      _server = this._hosts[Object.keys(this._hosts)[0]];

      debug('#%s Using first available connection from <{ %s }>', process.pid, Object.keys(this._hosts).join(', '));
    } catch (e) {
      res.status = 500;
      res.end(`Bad input: ${hostname} (${port})`);
      return;
    }
  }

  const conn = this._connection(null, {
    props: {
      server: () => _server,
      req: () => req,
      res: () => res,
    },
  });

  Promise.resolve()
    .then(() => {
      this._events.emit('request', conn, this._options);
    })
    .then(() => this._callback(conn, this._options))
    .catch(e => {
      this._events.emit('failure', e, conn, this._options);
    });
};
