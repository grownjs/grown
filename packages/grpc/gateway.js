'use strict';

const RE_SERVICE = /Service$/;
const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
  function _callService(client, method, data) {
    return new Promise((resolve, reject) => {
      const identifier = client.constructor.service[method]
        ? client.constructor.service[method].path
        : method;

      if (typeof client[method] !== 'function') {
        throw new Error(`Invalid method for '${identifier}' service`);
      }

      if (typeof data === 'undefined') {
        throw new Error(`Missing data for '${identifier}' request`);
      }

      try {
        const deadline = new Date();

        deadline.setSeconds(deadline.getSeconds() + (this.timeout || 5));

        client[method](data, { deadline }, (error, result) => {
          /* istanbul ignore else */
          if (error) {
            let parsedError;

            try {
              parsedError = JSON.parse(error.message);
            } catch (e) {
              parsedError = error;
              parsedError.code = 500;
            }

            return reject(parsedError);
          }

          return resolve(result);
        });
      } catch (e) {
        throw new Error(`Failed at calling ${identifier}: ${e.stack || e.message}`);
      }
    });
  }

  function _getService(name, controller) {
    Object.keys(controller).forEach(key => {
      const callback = controller[key];

      controller[key] = function $proxy(ctx, reply) {
        if (!ctx || typeof reply !== 'function') {
          throw new Error(`${name}#${key}: Illegal arguments`);
        }

        // overload given context
        ctx.handler = name;
        ctx.method = key;

        return Promise.resolve()
          .then(() => callback.call(this, ctx))
          .then(data => reply(null, data))
          .catch(e => reply(e));
      };
    });

    return controller;
  }

  return Grown('GRPC.Gateway', {
    _callService,
    _getService,

    setup(controllers) {
      const grpc = require('grpc');

      const _server = grpc.ServerCredentials.createInsecure();
      const _channel = grpc.credentials.createInsecure();

      const namespace = this.proto_namespace || 'API';
      const port = this.gateway_port || 50051;
      const server = new grpc.Server();
      const services = [];

      /* istanbul ignore else */
      if (!this[namespace]) {
        throw new Error(`${namespace} namespace not found`);
      }

      Object.keys(this[namespace]).forEach(key => {
        const id = key.replace(RE_DASHERIZE, ($0, $1) => $1.toLowerCase());
        const host = this.self_hostname === true ? id : '0.0.0.0';

        let _client;

        /* istanbul ignore else */
        if (server[`send${key}`]) {
          throw new Error(`Method 'send${key}' already setup`);
        }

        const name = key.replace(RE_SERVICE, '');
        const Proto = this[namespace][key];

        server[`send${name}`] = (method, data) => {
          /* istanbul ignore else */
          if (!_client) {
            _client = new Proto(`${host}:${port}`, _channel);
          }

          return this._callService(_client, method, data);
        };

        Object.keys(Proto.service).forEach(method => {
          util.setProp(server, `${namespace}.${name}.${method}`, data => {
            return server[`send${name}`](method, data);
          });
        });

        services.push([Proto, name]);
      });

      const _start = server.start.bind(server);

      server.start = () => {
        if (!server.started) {
          services.forEach(([Proto, name]) => {
            try {
              const handler = controllers.get(name);

              server.addService(Proto.service, this._getService(name, handler));
            } catch (e) {
              throw new Error(`Failed at loading '${name}' service. ${e.stack || e.message}`);
            }
          });

          server.bind(`0.0.0.0:${port}`, _server);
          _start();
        }

        return server;
      };

      return server;
    },
  });
};
