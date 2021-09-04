'use strict';

const { Resolver, Chainable } = require('sastre');
const $new = require('object-new');

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
    const repo = new Resolver(ctx || null, src, hooks);

    Object.keys(repo.values).forEach(key => {
      $new.readOnlyProperty(repo, key, () => repo.get(key));
    });

    return repo;
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
