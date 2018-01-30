'use strict';

const glob = require('glob');
const path = require('path');

const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
  const GRPC = require('grpc');

  return Grown('GRPC', {
    scan(cwd) {
      const credentials = GRPC.credentials.createInsecure();
      const namespace = this.proto_namespace || 'API';
      const port = this.default_port || 80;
      const map = {};

      glob.sync('**/schema.proto', { cwd })
        .forEach(proto => {
          const Proto = GRPC.load(path.join(cwd, proto));

          Object.keys(Proto[namespace]).forEach(key => {
            /* istanbul ignore else */
            if (Proto[namespace][key].service) {
              const id = key.replace(RE_DASHERIZE, ($0, $1) => $1.toLowerCase());

              util.setProp(map, `${namespace}.${key}`, new Proto[namespace][key](`${id}:${port}`, credentials));
            }
          });
        });

      Object.keys(map[namespace]).forEach(key => {
        this[`send${key}`] = (service, method, data) => {
          return this.request(map[namespace][key], method, data);
        };
      });

      this.extensions.push(map);

      return this;
    },

    request(client, method, data) {
      return new Promise((resolve, reject) => {
        const deadline = new Date();

        deadline.setSeconds(deadline.getSeconds() + (this.timeout || 10));

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
