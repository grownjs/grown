'use strict';

const glob = require('glob');
const path = require('path');

const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
  const grpc = require('grpc');

  function _callService(client, method, data) {
    return new Promise((resolve, reject) => {
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
    });
  }

  return Grown('GRPC.Gateway', {
    _callService,

    load(cwd) {
      const namespace = this.proto_namespace || 'API';
      const map = {};

      glob.sync('**/schema.proto', { cwd })
        .forEach(proto => {
          const Proto = grpc.load(path.join(cwd, proto));
          const name = path.basename(path.dirname(proto));

          /* istanbul ignore else */
          if (!Proto[namespace]) {
            throw new Error(`${name}.${namespace} package not found`);
          }

          Object.keys(Proto[namespace]).forEach(key => {
            /* istanbul ignore else */
            if (Proto[namespace][key].service) {
              util.setProp(map, `${namespace}.${key}`, Proto[namespace][key]);
            }
          });
        });

      this.extensions.push(map);

      return this;
    },

    setup(controllers) {
      const _server = grpc.ServerCredentials.createInsecure();
      const _channel = grpc.credentials.createInsecure();

      const namespace = this.proto_namespace || 'API';
      const port = this.gateway_port || 50051;
      const server = new grpc.Server();

      /* istanbul ignore else */
      if (!this[namespace]) {
        throw new Error(`${namespace} namespace not found`);
      }

      Object.keys(this[namespace]).forEach(key => {
        const id = key.replace(RE_DASHERIZE, ($0, $1) => $1.toLowerCase());
        const host = this.self_hostname === true ? id : '0.0.0.0';

        const Proto = this[namespace][key];
        const Ctrl = controllers[key];

        let _client;

        /* istanbul ignore else */
        if (Grown.GRPC[`send${key}`]) {
          throw new Error(`Method 'send${key}' already setup`);
        }

        Grown.GRPC[`send${key}`] = (method, data) => {
          /* istanbul ignore else */
          if (!_client) {
            _client = new Proto(`${host}:${port || 50051}`, _channel);
          }

          return this.request(_client, method, data);
        };

        server.addService(Proto.service, new Ctrl());
      });

      server.bind(`0.0.0.0:${port}`, _server);

      return server;
    },

    request(client, method, data) {
      return this._callService(client, method, data);
    },
  });
};
