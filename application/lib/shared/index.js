const fs = require('fs')
const path = require('path')

class Sites {
  constructor(baseDir) {
    this.all = Plugin.readdir(baseDir)
      .map(id => {
        const configFile = path.join(baseDir, id, 'settings.json');
        const config = Plugin.isFile(configFile)
          ? require(configFile)
          : {};

        return { id, config, baseDir };
      });
  }

  get enabled() {
    return this.all.filter(site => site.config.enabled);
  }

  get paths() {
    return this.all.reduce((memo, cur) => {
      const graphql = path.join(cur.baseDir, cur.id, 'api/schema/graphql');
      const handlers = path.join(cur.baseDir, cur.id, 'api/handlers');

      if (Plugin.isDir(graphql)) memo.push(graphql);
      if (Plugin.isDir(handlers)) memo.push(handlers);

      return memo;
    }, []);
  }

  find(sub) {
    return this.paths.filter(x => x.includes(sub));
  }

  locate({ req }, fallback) {
    const enabled = this.enabled.sort((a, b) => (b.config.match ? 1 : (a.config.match ? -1 : 0)));
    const hostname = req.headers.host || '';

    fallback = fallback || req.url.split('/')[1];

    return enabled.find(site => !site.config.match || site.config.match.some(str => hostname.includes(str)))
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
      .reduce((memo, id) => {
        const indexFile = path.join(fullDir, id, 'index.js');
        const definition = Plugin.isFile(indexFile) && require(indexFile);

        if (definition) memo.push(cb(definition));
        return memo;
      }, []);
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
