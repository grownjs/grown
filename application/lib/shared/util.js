const fs = require('fs');
const path = require('path');

class Util {
  static isDir(x) {
    return fs.existsSync(x) && fs.statSync(x).isDirectory();
  }

  static isFile(x) {
    return fs.existsSync(x) && fs.statSync(x).isFile();
  }

  static readdir(x) {
    return fs.readdirSync(x)
      .filter(y => Util.isDir(path.join(x, y)));
  }
}

module.exports = Util;
