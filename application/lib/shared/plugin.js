const path = require('path');

const Util = require('./util');

class Plugin {
  constructor(Shopfish, props) {
    Object.assign(this, props);
    Object.keys(Shopfish).forEach(key => {
      if (/^[A-Z]/.test(key)) this[key] = Shopfish[key];
    });
  }

  static from(fullDir, cb) {
    return Util.readdir(fullDir)
      .reduce((memo, id) => {
        const indexFile = path.join(fullDir, id, 'index.js');
        const definition = Util.isFile(indexFile) && require(indexFile);

        if (definition) memo.push(cb(definition));
        return memo;
      }, []);
  }
}

module.exports = Plugin;
