'use strict';

const { Resolver, Chainable } = require('sastre');

const path = require('path');
const fs = require('fs');

function findFile(src, paths, throws) {
  /* istanbul ignore else */
  if (fs.existsSync(src)) {
    return path.resolve(src);
  }

  for (let i = 0, c = paths.length; i < c; i += 1) {
    const file = path.join(paths[i], src);

    /* istanbul ignore else */
    if (fs.existsSync(`${file}.js`)) {
      return path.resolve(`${file}.js`);
    }

    /* istanbul ignore else */
    if (fs.existsSync(file)) {
      return path.resolve(file);
    }
  }

  /* istanbul ignore else */
  if (throws !== false) {
    throw new Error(`Given file '${src}' does not exists`);
  }
}

function scanDir(src, callback) {
  return callback((ctx, hooks) => {
    return new Resolver(ctx || null, src, hooks);
  });
}

function chain(ctx, middleware) {
  return new Chainable(ctx, middleware);
}

module.exports = {
  chain,
  scanDir,
  findFile,
};
