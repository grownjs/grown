const path = require('path');

const Util = require('./util');

class Sites {
  constructor(baseDir) {
    this.cwd = baseDir;
    this.all = Util.readdir(baseDir)
      .map(id => {
        const configFile = path.join(baseDir, id, 'settings.json');
        const config = Util.isFile(configFile)
          ? require(configFile)
          : {};

        return { id, config };
      });
  }

  get enabled() {
    return this.all.filter(site => site.config.enabled);
  }

  get paths() {
    return this.all.reduce((memo, cur) => {
      const graphql = path.join(this.cwd, cur.id, 'api/schema/graphql');
      const models = path.join(this.cwd, cur.id, 'api/models.js');
      const handlers = path.join(this.cwd, cur.id, 'api/handlers');

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
