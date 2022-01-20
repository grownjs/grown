'use strict';

const path = require('path');
const fs = require('fs');

module.exports = (Grown, util) => {
  return Grown('GRPC.Loader', {
    scan(file, options) {
      /* istanbul ignore else */
      if (!fs.existsSync(file)) {
        throw new Error(`Unable to load protobuf, given '${file}'`);
      }

      const protoLoader = require('@grpc/proto-loader');
      const grpc = require('@grpc/grpc-js');

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
