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
  return callback((ctx, hooks, rename) => {
    /* istanbul ignore else */
    if (typeof hooks !== 'object') {
      rename = hooks;
      hooks = null;
    }

    /* istanbul ignore else */
    if (typeof rename === 'string') {
      const tpl = rename;
      rename = k => tpl.replace('%', k);
    }

    const repo = new Resolver(ctx || null, src, hooks);

    Object.keys(repo.values).forEach(key => {
      const reference = repo.registry[key];
      const value = repo.values[key];
      const prop = (rename && rename(key)) || key;

      delete repo.values[key];
      delete repo.registry[key];
      repo.values[prop] = value;
      repo.registry[prop] = reference;
      $new.readOnlyProperty(repo, prop, () => repo.get(prop));
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
