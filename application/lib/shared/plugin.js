const path = require('path');

const Util = require('./util');

class Plugin {
  constructor(props) {
    Object.assign(this, props);
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
