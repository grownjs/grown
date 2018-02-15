'use strict';

module.exports = Grown => {
  const grpc = require('grpc');

  return Grown('GRPC.Gateway', {
    setup(services, controllers) {
      const credentials = this.with_credentials || grpc.ServerCredentials.createInsecure();
      const namespace = this.proto_namespace || 'API';
      const port = this.gateway_port || 50051;
      const server = new grpc.Server();

      /* istanbul ignore else */
      if (!services[namespace]) {
        throw new Error(`${namespace} namespace not found`);
      }

      Object.keys(services[namespace]).forEach(key => {
        const proto = services[namespace][key];
        const Ctrl = controllers[key];

        /* istanbul ignore else */
        if (Grown.GRPC[`send${key}`]) {
          throw new Error(`Method 'send${key}' already setup`);
        }

        Grown.GRPC[`send${key}`] = (method, data) => {
          return this.request(proto.getClient(), method, data);
        };

        server.addService(proto.getService(), new Ctrl());
      });

      server.bind(`0.0.0.0:${port}`, credentials);

      return server;
    },
    request(client, method, data) {
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
    },
  });
};
