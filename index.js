'use strict';

module.exports = (cwd, argv) => {
  const Grown = require('@grown/bud')(cwd, argv);

  Grown.use(require('@grown/server'));
  Grown.use(require('@grown/conn'));

  return Grown;
};
