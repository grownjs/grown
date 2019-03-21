'use strict';

module.exports = (Grown, util) => {
  return Grown('Model.Loader', {
    scan(fromDir, hooks) {
      return util.scanDir(fromDir, def => def(Grown, hooks || {}));
    },
  });
};
