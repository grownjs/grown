'use strict';

const debug = require('debug')('grown:host');

const util = require('../util');

const $new = require('object-new');
const path = require('path');

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
    debug('Wait. Missing connection object for %s (%s)', hostname, port);

    try {
      // fallback
      _server = this._hosts[Object.keys(this._hosts)[0]];
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
  this._invoke($new({
    props: {
      req: () => req,
      res: () => res,
      pid: () => PID,

      // host info
      server: _server,

      // current environment
      env: () => util.extend({}, _environment),

      // main script location
      script_name: () => path.resolve(process.argv[1]),
    },
    methods: {
      options: this._options,
    },
    extensions: this._extensions,
  }), this._options);
};
