'use strict';

const _servers = [];

const useFactory = require('./lib/api/use');
const mountFactory = require('./lib/api/mount');
const listenFactory = require('./lib/api/listen');
const dispatchFactory = require('./lib/api/dispatch');

function _factory(options) {
  const context = {
    hosts: {},
    servers: {},
    protocols: {},
  };

  const container = {
    options: options || {},
    pipeline: [],
    extensions: {},
  };

  _servers.push(context);

  useFactory(context, container);
  mountFactory(context, container);
  listenFactory(context, container);
  dispatchFactory(context, container);

  return context;
}

module.exports = _factory;

_factory.servers = () => _servers;
