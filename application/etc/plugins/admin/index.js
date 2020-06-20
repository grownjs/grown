const { Sites, Plugin } = require('../../shared');

class AdminPlugin extends Plugin {
  onAdmin(ctx) {
    return ctx.render('admin/views/panel');
  }

  routeMappings(map) {
    return map()
      .get('/api/status', ctx => {
        ctx.res.write(JSON.stringify(ctx.req.headers, null, 2));
        ctx.res.status(200);
      })
      .get('/admin', this.onAdmin)
      .get('/admin/*path', this.onAdmin);
  }
}

module.exports = (Shopfish, config) => {
  const siteManager = new Sites(Shopfish.cwd, 'etc/tenants');
  const pluginInstance = new AdminPlugin({
    enabled: config.admin,
    name: 'adminPlugin',
    siteManager,
  });

  return pluginInstance;
};
