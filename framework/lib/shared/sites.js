const path = require('path');

const Util = require('./util');

class Sites {
  constructor(fromDirs) {
    this.all = fromDirs.reduce((memo, dir) => memo.concat(Util.readdir(dir).map(id => {
      const baseDir = path.join(dir, id);
      const configFile = path.join(baseDir, 'settings.json');
      const config = Util.isFile(configFile)
        ? require(configFile)
        : {};

      return { id, config, baseDir };
    })), []);
  }

  get enabled() {
    return this.all.filter(site => site.config.enabled);
  }

  get paths() {
    return this.all.reduce((memo, x) => {
      const graphql = path.join(x.baseDir, 'api/schema/graphql');
      const models = path.join(x.baseDir, 'api/models.js');
      const handlers = path.join(x.baseDir, 'api/handlers');

      if (Util.isFile(models)) memo.push(models);
      if (Util.isDir(graphql)) memo.push(graphql);
      if (Util.isDir(handlers)) memo.push(handlers);

      return memo;
    }, []);
  }

  find(sub) {
    return this.paths.filter(x => x.includes(sub));
  }

  locate({ req }, fallback) {
    const enabled = this.enabled.sort((a, b) => (b.config.match && 1) || (a.config.match ? -1 : 0));
    const hostname = req.headers.host || '';

    fallback = fallback || req.url.split('/')[1];

    return enabled.find(site => site.config.match && site.config.match.some(str => hostname.includes(str)))
      || (fallback && enabled.find(site => site.id === fallback))
      || null;
  }
}

module.exports = Sites;
