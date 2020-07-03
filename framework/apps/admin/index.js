const { Plugin } = require('../../lib/shared');

class AdminPlugin extends Plugin {
  async onAdmin(ctx, site) {
    const panelView = await ctx.bundle('admin/views/panel');
    const allModels = this.siteManager.all.reduce((memo, x) => {
      if (this.Grown.Model.DB[x.id]) {
        if (!memo[x.id]) memo[x.id] = [];
        memo[x.id].push(Object.keys(this.Grown.Model.DB[x.id].models));
      }
      return memo;
    }, {});

    return ctx.render('admin/views/layout', {
      body: panelView({
        models: allModels,
        plugins: this.siteManager.all,
        selected: site.id,
      }),
      pkg: this.Grown.pkg,
      env: process.env,
      base: `/${site.id}/`,
      scripts: `<script src="/assets/${site.id}.js"></script>`,
      styles: `<link rel="stylesheet" href="/assets/${site.id}.css" />`,
    });
  }

  routeMappings(map) {
    const routes = map()
      .get('/api/status', ({ req, res }) => {
        res.write(JSON.stringify(req.headers, null, 2));
        res.status(200);
      });

    this.siteManager.all.forEach(x => {
      routes.get(`/${x.id}`, ctx => this.onAdmin(ctx, x));
      routes.get(`/${x.id}/*path`, ctx => this.onAdmin(ctx, x));
    });

    return routes;
  }
}

module.exports = (Grown, config) => {
  const siteManager = Grown.ApplicationServer.getSites();
  const pluginInstance = new AdminPlugin({
    enabled: config.admin || true,
    name: 'adminPlugin',
    siteManager,
    Grown,
  });

  return pluginInstance;
};
