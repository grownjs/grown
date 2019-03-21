'use strict';

const path = require('path');

module.exports = (Grown, util) => {
  return Grown('GRPC.Loader', {
    scan(file, options) {
      const protoLoader = require('@grpc/proto-loader');
      const grpc = require('grpc');

      const protoOptions = Object.assign({
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      }, options);

      const packageDefinition = protoLoader.loadSync(file, protoOptions);
      const Proto = grpc.loadPackageDefinition(packageDefinition);
      const name = path.basename(file);
      const map = {};

      const ns = this.proto_namespace || 'API';

      /* istanbul ignore else */
      if (!Proto[ns]) {
        throw new Error(`${name}::${ns} package not found`);
      }

      Object.keys(Proto[ns]).forEach(key => {
        /* istanbul ignore else */
        if (Proto[ns][key].service && !Proto[ns][key].service.type) {
          util.setProp(map, `${ns}.${key}`, Proto[ns][key]);
        }
      });

      return map;
    },
  });
};
