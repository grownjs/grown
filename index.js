'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (cwd, argv) => {
  const Grown = require('@grown/bud')(cwd, argv);

  Grown.use(require('@grown/server'));

  const dir = path.join(process.cwd(), 'node_modules/@grown');

  if (fs.existsSync(dir)) {
    Grown.bind('@grown/', dir);
  }

  return Grown;
};
