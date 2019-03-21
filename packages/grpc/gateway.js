'use strict';

const RE_SERVICE = /Service$/;
const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
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

    setup(controllers) {
      const grpc = require('grpc');

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

        try {
          server.addService(Proto.service, controllers.get(name));
        } catch (e) {
          throw new Error(`Failed at loading '${name}' service. ${e.stack || e.message}`);
        }
      });

      const _start = server.start.bind(server);

      server.start = () => {
        if (!server.started) {
          server.bind(`0.0.0.0:${port}`, _server);
          _start();
        }

        return server;
      };

      return server;
    },
  });
};
