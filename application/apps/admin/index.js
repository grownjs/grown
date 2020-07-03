const { Plugin } = require('~/lib/shared');

class AdminPlugin extends Plugin {
  async onAdmin(ctx, site) {
    const panelView = await ctx.bundle('admin/views/panel');
    const allModels = this.siteManager.all.reduce((memo, site) => {
      if (this.Shopfish.Model.DB[site.id]) {
        if (!memo[site.id]) memo[site.id] = [];
        memo[site.id].push(Object.keys(this.Shopfish.Model.DB[site.id].models));
      }
      return memo;
    }, {});

    return ctx.render('admin/views/layout', {
      body: panelView({
        models: allModels,
        plugins: this.siteManager.all,
        selected: site.id,
      }),
      pkg: this.Shopfish.pkg,
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

    this.siteManager.all.forEach(site => {
      routes.get(`/${site.id}`, ctx => this.onAdmin(ctx, site));
      routes.get(`/${site.id}/*path`, ctx => this.onAdmin(ctx, site));
    });

    return routes;
  }
}

module.exports = (Shopfish, config) => {
  const siteManager = Shopfish.ApplicationServer.getSites();
  const pluginInstance = new AdminPlugin({
    enabled: config.admin,
    name: 'adminPlugin',
    siteManager,
    Shopfish,
  });

  return pluginInstance;
};
