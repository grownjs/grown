'use strict';

module.exports = (Grown, util) => {
  return Grown('GRPC.Controllers', {
    scan(cwd) {
      return util.scanDir(cwd, 'Controller', cb => cb(Grown, util));
    },
  });
};
