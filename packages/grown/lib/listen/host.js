'use strict';

const debug = require('debug')('grown:listen');

const $new = require('object-new');
const path = require('path');

const util = require('../util/object');

let pid = 0;

module.exports = function $host(_protocol, req, res) {
  const PID = `${process.pid}.${pid}`;

  pid += 1;

  // normalize
  const host = req.headers.host ? req.headers.host : '';
  const port = host.split(':')[1] || _protocol.globalAgent.defaultPort;
  const hostname = port ? host : `${host}:${_protocol.globalAgent.defaultPort}`;

  debug('#%s (%s) %s %s',
    PID,
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
    debug('#%s Wait. Missing connection for %s (%s)', PID, hostname, port);

    try {
      // fallback
      _server = this._hosts[hostname] = this._hosts[Object.keys(this._hosts)[0]];

      debug('#%s Using first available host from <{ %s }>', PID, Object.keys(this._hosts).join(', '));
    } catch (e) {
      res.status = 500;
      res.end(`Bad input: ${hostname} (${port})`);
      return;
    }
  }

  // skip npm-cli keys
  const _environment = {};

  Object.keys(process.env).forEach(key => {
    if (key.indexOf('npm_') === -1) {
      _environment[key] = process.env[key];
    }
  });

  // built-in connection
  this._callback($new({
    name: 'Conn',
    props: {
      req: () => req,
      res: () => res,
      pid: () => PID,

      // current environment
      env: () => util.extendValues({}, _environment),

      // placeholder
      next: null,

      // host info
      server: _server,

      // main script location
      script_name: path.resolve(process.argv[1]),
    },
    extensions: this._extensions,
  }), this._options);
};
