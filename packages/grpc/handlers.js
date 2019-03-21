'use strict';

module.exports = (Grown, util) => {
  return Grown('GRPC.Handlers', {
    scan(fromDir, hooks) {
      return util.scanDir(fromDir, def => def(Grown, hooks || {}));
    },
  });
};
