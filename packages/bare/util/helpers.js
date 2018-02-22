'use strict';

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _obj = require('./object');

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

function scanDir(cwd, suffix, callback) {
  const _suffix = suffix
    ? `(?:/?${suffix})?`
    : '';

  const reSuffix = new RegExp(`${_suffix}(?:/index)?\\.js`, 'g');

  const _extensions =
    glob.sync('**/*.js', { cwd })
      .filter(x => x !== 'index.js' || (suffix && x.indexOf(suffix) !== -1))
      .map(x => ({
        src: path.join(cwd, x),
        name: path.relative(cwd, path.join(cwd, x)).replace(reSuffix, ''),
      }));

  const map = {};

  _extensions.forEach(x => {
    let target = require(x.src);

    /* istanbul ignore else */
    if (typeof target === 'function') {
      target = callback(target);
    }

    _obj.setProp(map, x.name
        .split('/')
        .map(x => x.replace(/-([a-z])/g, ($0, $1) => $1.toUpperCase()))
        .join('.'), target);
  });

  return map;
}

module.exports = {
  scanDir,
  findFile,
};
