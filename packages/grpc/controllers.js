'use strict';

const glob = require('glob');
const path = require('path');

const RE_CTRL = /(?:\/?Controller)?(?:\/index)?\.js/g;

module.exports = (Grown, util) => {
  return Grown('GRPC.Controllers', {
    scan(cwd) {
      const _controllers =
        glob.sync('**/*.js', { cwd })
          .filter(x => x !== 'index.js' || x.indexOf('Controller') !== -1)
          .map(x => ({
            src: path.join(cwd, x),
            name: path.relative(cwd, path.join(cwd, x)).replace(RE_CTRL, ''),
          }));

      const ctrl = {};

      _controllers.forEach(x => {
        util.setProp(ctrl, x.name.split('/').join('.'), require(x.src)(Grown, util));
      });

      this.extensions.push(ctrl);

      return this;
    },
  });
};
