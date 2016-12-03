'use strict';

const _env = require('dotenv');

const _farms = [];

function _closeAll() {
  _farms.forEach((farm) => {
    Object.keys(farm._context.hosts).forEach((host) => {
      farm._context.hosts[host].close();
    });
  });
}

// gracefully dies
process.on('exit', _closeAll);
process.on('SIGINT', () => process.exit());

const useFactory = require('./lib/api/use');
const mountFactory = require('./lib/api/mount');
const listenFactory = require('./lib/api/listen');
const pipelineFactory = require('./lib/pipeline');

module.exports.new = (options) => {
  const container = {
    _context: {
      hosts: {},
      servers: {},
      protocols: {},
    },
    options: options || {},
    pipeline: [],
    extensions: {},
  };

  _farms.push(container);

  useFactory(container);
  mountFactory(container);
  listenFactory(container);

  Object.defineProperty(container, '_configure', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: (_opts) => _env.config(_opts || { silent: true }),
  });

  function _dispatch(err, conn) {
    /* istanbul ignore else */
    if (conn.res._hasBody && conn.res._headerSent) {
      conn.res.end();
      return;
    }

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

  Object.defineProperty(container, '_dispatch', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: pipelineFactory('_dispatch', container.pipeline, _dispatch),
  });

  return container._context;
};

module.exports.burn = _closeAll;
module.exports.farms = cb => _farms.forEach(cb);
module.exports.version = require('./package.json').version;
