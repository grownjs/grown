'use strict';

const path = require('path');
const fs = require('fs');

function findFile(src, paths, throws) {
  /* istanbul ignore else */
  if (fs.existsSync(src)) {
    return src;
  }

  for (let i = 0, c = paths.length; i < c; i += 1) {
    const file = path.join(paths[i], src);

    /* istanbul ignore else */
    if (fs.existsSync(`${file}.js`)) {
      return `${file}.js`;
    }

    /* istanbul ignore else */
    if (fs.existsSync(file)) {
      return file;
    }
  }

  if (throws !== false) {
    throw new Error(`Given file '${src}' does not exists`);
  }
}

module.exports = {
  findFile,
};
