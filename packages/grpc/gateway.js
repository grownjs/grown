'use strict';

const RE_SERVICE = /Service$/;
const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
  const grpc = require('@grpc/grpc-js');

  // FIXME: implements streaming & metadata!
  function _callDeadline(timeout) {
    const now = new Date();

    now.setSeconds(now.getSeconds() + timeout);

    return now;
  }

  function _callService(options, client, method, data) {
    return new Promise((resolve, reject) => {
      const identifier = (client.constructor.service[method] && client.constructor.service[method].path) || method;

      /* istanbul ignore else */
      if (typeof client[method] !== 'function') {
        throw new Error(`Invalid method for '${identifier}' service`);
      }

      /* istanbul ignore else */
      if (typeof data === 'undefined') {
        const { requestType } = client.constructor.service[method];

        /* istanbul ignore else */
        if (requestType && requestType.type.field.length) {
          throw new Error(`Missing data for '${identifier}' request`);
        }
      }

      client[method](data, { deadline: this._callDeadline(options.timeout) }, (error, result) => {
        /* istanbul ignore else */
        if (error) {
          return reject(error);
        }

        return resolve(result);
      });
    });
  }

  function _getService(name, handler) {
    Object.keys(handler).forEach(key => {
      const callback = handler[key];

      handler[key] = function $proxy(ctx, reply) {
        // overload given context
        ctx.handler = name;
        ctx.method = key;

        return Promise.resolve()
          .then(() => callback.call(this, ctx))
          .then(data => reply(null, data))
          .catch(e => {
            const meta = new grpc.Metadata();

            meta.add('originalError', JSON.stringify({
              message: e.message,
              stack: e.stack,
              code: e.code,
            }));

            reply(e, null, meta);
          });
      };
    });

    return handler;
  }

  function _onError(e) {
    const originalError = e.metadata && e.metadata.get('originalError');

    try {
      /* istanbul ignore else */
      if (originalError && typeof originalError[0] === 'string'
        && (originalError[0].charAt() === '{' && originalError[0].charAt(originalError[0].length - 1) === '}')) {
        e.original = JSON.parse(originalError[0]);

        const err = new Error(e.original.message);

        err.stack = e.original.stack;
        e.original = err;
      }
    } catch (_e) {
      // do nothing
    }

    throw e.original || e;
  }

  return Grown('GRPC.Gateway', {
    _callDeadline,
    _callService,
    _getService,
    _onError,

    setup(controllers, options) {
      if (!controllers) {
        throw new TypeError(`Missing gRPC controllers, given '${controllers}'`);
      }

      const _server = grpc.ServerCredentials.createInsecure();
      const _channel = grpc.credentials.createInsecure();
      const _settings = options || {};

      const namespace = _settings.namespace || 'API';
      const port = _settings.port || 50051;
      const server = new grpc.Server();
      const services = [];
      const map = {};

      /* istanbul ignore else */
      if (!this[namespace]) {
        throw new Error(`Service '${namespace}' not found`);
      }

      Object.keys(this[namespace]).forEach(key => {
        const id = key.replace(RE_DASHERIZE, ($0, $1) => $1.toLowerCase());
        const host = (typeof _settings.hostname === 'function' && _settings.hostname(id)) || '0.0.0.0';
        const name = key.replace(RE_SERVICE, '');
        const Proto = this[namespace][key];

        let _client;

        map[`send${name}`] = (method, data) => {
          /* istanbul ignore else */
          if (!_client) {
            _client = new Proto(!host.includes(':') ? `${host}:${port}` : host, _channel);
          }

          return this._callService(_settings, _client, method, data).catch(this._onError);
        };

        Object.keys(Proto.service).forEach(method => {
          util.setProp(map, `${namespace}.${name}.${method}`, data => {
            return map[`send${name}`](method, data);
          });
        });

        services.push([Proto, name]);
      });

      map.start = _port => new Promise(resolve => {
        /* istanbul ignore else */
        if (!server.started) {
          services.forEach(([Proto, name]) => {
            try {
              const handler = controllers.get(name);

              server.addService(Proto.service, this._getService(name, handler));
            } catch (e) {
              throw new Error(`Failed at loading '${name}' service. ${e.stack || e.message}`);
            }
          });

          server.bindAsync(`0.0.0.0:${_port || port}`, _server, err => {
            if (err) throw err;
            server.start();
            resolve(map);
          });
        } else {
          resolve(map);
        }
      });

      map.stop = (cb = () => {}) => {
        server.tryShutdown(cb);
      };

      return map;
    },
  });
};
