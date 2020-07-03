'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (cwd, argv) => {
  const Grown = require('@grown/bud')(cwd, argv);

  Grown.use(require('@grown/server'));

  return Grown;
};
