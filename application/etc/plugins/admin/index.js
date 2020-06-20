const { Sites, Plugin } = require('../../shared');

class AdminPlugin extends Plugin {
  onAdmin(ctx) {
    return ctx.render('layout', {
      body: 'FIXME',
      pkg: this.pkg,
      env: process.env,
      base: '/admin/',
      scripts: '<script src="/assets/admin.js"></script>',
      styles: '<link rel="stylesheet" href="/assets/admin.css" />',
    });
  }

  routeMappings(map) {
    return map()
      .get('/api/status', ctx => {
        ctx.res.write(JSON.stringify(ctx.req.headers, null, 2));
        ctx.res.status(200);
      })
      .get('/admin', this.onAdmin.bind(this))
      .get('/admin/*path', this.onAdmin.bind(this));
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
