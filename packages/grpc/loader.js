'use strict';

const glob = require('glob');
const path = require('path');

const RE_DASHERIZE = /\b([A-Z])/g;

module.exports = (Grown, util) => {
  const grpc = require('grpc');

  return Grown('GRPC.Loader', {
    scan(cwd) {
      const credentials = this.with_credentials || grpc.credentials.createInsecure();
      const namespace = this.proto_namespace || 'API';
      const port = this.gateway_port || 50051;
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
              const id = key.replace(RE_DASHERIZE, ($0, $1) => $1.toLowerCase());

              let _client;

              util.setProp(map, `${namespace}.${key}`, {
                getClient: () => {
                  /* istanbul ignore else */
                  if (!_client) {
                    _client = new Proto[namespace][key](`${id}:${port}`, credentials);
                  }

                  return _client;
                },
                getService: () => Proto[namespace][key].service,
              });
            }
          });
        });

      this.extensions.push(map);

      return this;
    },
  });
};
