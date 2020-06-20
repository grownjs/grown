const { Sites, Plugin } = require('../../shared');

class AdminPlugin extends Plugin {
  onAdmin(ctx, site) {
    return ctx.render('layout', {
      body: `<pre>${JSON.stringify({
        matches: ctx.req.site,
        current: site,
      }, null, 2)}</pre>`,
      pkg: this.pkg,
      env: process.env,
      base: `/${site.id}/`,
      scripts: `<script src="/assets/${site.id}.js"></script>`,
      styles: `<link rel="stylesheet" href="/assets/${site.id}.css" />`,
    });
  }

  routeMappings(map) {
    const routes = map()
      .get('/api/status', ctx => {
        ctx.res.write(JSON.stringify(ctx.req.headers, null, 2));
        ctx.res.status(200);
      });

    this.siteManager.all.forEach(site => {
      routes.get(`/${site.id}`, ctx => this.onAdmin(ctx, site));
      routes.get(`/${site.id}/*path`, ctx => this.onAdmin(ctx, site));
    });

    return routes;
  }
}

module.exports = (Shopfish, config) => {
  const siteManager = new Sites(Shopfish.cwd, 'etc/plugins');
  const pluginInstance = new AdminPlugin({
    enabled: config.admin,
    name: 'adminPlugin',
    siteManager,
    ...Shopfish,
  });

  return pluginInstance;
};
