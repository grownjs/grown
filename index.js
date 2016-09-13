'use strict';

const _env = require('dotenv');

const _servers = [];

const useFactory = require('./lib/api/use');
const mountFactory = require('./lib/api/mount');
const listenFactory = require('./lib/api/listen');
const pipelineFactory = require('./lib/pipeline');

function _dispatch(err, conn) {
  /* istanbul ignore else */
  if (!conn.res.finished || !err) {
    if (conn.body === null && conn.res.statusCode === 200) {
      const errObj = err || new Error('Not Implemented');

      errObj.statusMessage = errObj.statusMessage || errObj.message;
      errObj.statusCode = errObj.statusCode || 501;

      throw errObj;
    } else {
      conn.send(conn.body);
    }
  }
}

function _factory(options) {
  const container = {
    context: {
      hosts: {},
      servers: {},
      protocols: {},
    },
    options: options || {},
    pipeline: [],
    extensions: {},
  };

  _servers.push(container);

  useFactory(container);
  mountFactory(container);
  listenFactory(container);

  Object.defineProperty(container, '_configure', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: (_opts) => _env.config(_opts || { silent: true }),
  });

  Object.defineProperty(container, '_dispatch', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: pipelineFactory('_dispatch', container.pipeline, _dispatch),
  });

  return container.context;
}

module.exports = _factory;

_factory.farms = () => _servers;
