const fs = require('fs')
const path = require('path')

function isDir(x) {
  return fs.statSync(x).isDirectory();
}

class Sites {
  constructor(cwd, baseDir) {
    const names = fs.readdirSync(path.join(cwd, baseDir))
      .filter(x => isDir(path.join(cwd, baseDir, x)));

    this.all = names.map(name => ({ name, config: require(path.join(cwd, baseDir, name, 'settings.json')) }));
  }

  locate({ req }, fallback) {
    const enabled = this.all.filter(site => site.config.enabled);
    const hostname = req.headers.host || '';

    return enabled.find(site => site.config.match.some(str => hostname.includes(str)))
      || (fallback && enabled.find(site => site.name === fallback))
      || null;
  }
}

class Plugin {
  constructor(props) {
    Object.assign(this, props);
  }
}

module.exports = {
  isDir,
  Sites,
  Plugin,
};
