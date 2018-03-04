'use strict';

module.exports = (cwd, argv) => {
  const Grown = require('@grown/bare')(cwd, argv);

  Grown.use(require('@grown/server'));

  return Grown;
};
