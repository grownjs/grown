const fs = require('fs')
const path = require('path')

class Sites {
  constructor(cwd, baseDir) {
    this.all = Plugin.readdir(path.join(cwd, baseDir))
      .map(id => ({ id, config: require(path.join(cwd, baseDir, id, 'settings.json')) }));
  }

  locate({ req }, fallback) {
    const enabled = this.all.filter(site => site.config.enabled);
    const hostname = req.headers.host || '';

    return enabled.find(site => site.config.match.some(str => hostname.includes(str)))
      || (fallback && enabled.find(site => site.id === fallback))
      || null;
  }
}

class Plugin {
  constructor(props) {
    Object.assign(this, props);
  }

  static from(fullDir, cb) {
    return Plugin.readdir(fullDir)
      .map(id => ({ id, ...cb(require(path.join(fullDir, id))) }));
  }

  static isDir(x, y) {
    return fs.existsSync(x) && fs.statSync(x).isDirectory();
  }

  static isFile(x) {
    return fs.existsSync(x) && fs.statSync(x).isFile();
  }

  static readdir(x) {
    return fs.readdirSync(x)
      .filter(y => Plugin.isDir(path.join(x, y)));
  }
}

module.exports = {
  Sites,
  Plugin,
};
