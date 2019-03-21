'use strict';

const path = require('path');

const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
  const grpc = require('grpc');

  function _callService(client, method, data) {
    return new Promise((resolve, reject) => {
      const deadline = new Date();

      deadline.setSeconds(deadline.getSeconds() + (this.timeout || 5));

      if (!client[method] || typeof client[method] !== 'function') {
        throw new Error(`${util.inspect(client).split(' ')[0]}#${method} is not a function`);
      }

      if (typeof data === 'undefined') {
        throw new Error(`${util.inspect(client).split(' ')[0]}#${method}: Missing data`);
      }

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

    load(file, options) {
      const protoLoader = require('@grpc/proto-loader');

      const protoOptions = {
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        ...options,
      };

      const packageDefinition = protoLoader.loadSync(file, protoOptions);
      const Proto = grpc.loadPackageDefinition(packageDefinition);
      const name = path.basename(file);

      const namespace = this.proto_namespace || 'API';

      /* istanbul ignore else */
      if (!Proto[namespace]) {
        throw new Error(`${name}::${namespace} package not found`);
      }

      Object.keys(Proto[namespace]).forEach(key => {
        /* istanbul ignore else */
        if (Proto[namespace][key].service && !Proto[namespace][key].service.type) {
          util.setProp(this, `${namespace}.${key}`, Proto[namespace][key]);
        }
      });

      return this;
    },

    setup(controllers, suffix) {
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
        const handler = typeof suffix === 'string'
          ? key.replace(suffix, '')
          : key;

        let _client;

        /* istanbul ignore else */
        if (server[`send${handler}`]) {
          throw new Error(`Method 'send${handler}' already setup`);
        }

        const Proto = this[namespace][key];

        server[`send${handler}`] = (method, data) => {
          /* istanbul ignore else */
          if (!_client) {
            _client = new Proto(`${host}:${port}`, _channel);
          }

          return this.request(_client, method, data);
        };

        server.addService(Proto.service, controllers.get(handler));
      });

      const _start = server.start.bind(server);

      server.start = () => {
        server.bind(`0.0.0.0:${port}`, _server);
        _start();
      };

      return server;
    },

    request(client, method, data) {
      return this._callService(client, method, data);
    },
  });
};
