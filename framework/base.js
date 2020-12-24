const path = require('path');
const fs = require('fs');

module.exports = Grown => {
  Grown('Services', {
    include: [require('./http')(Grown)],
  });

  Grown.use(require('@grown/server'));
  Grown.use(require('@grown/conn'));

  const app = new Grown();

  app.plug(Grown.Conn);
  app.plug([null]);
  app.mount(ctx => {
    const name = ctx.req.url.substr(1).split('?')[0];
    const res = path.join(Grown.cwd, 'public', name || 'index.html');

    if (fs.existsSync(res) && fs.statSync(res).isFile()) {
      return ctx.send_file(res);
    }

    ctx.content_type = 'text/plain';
    ctx.resp_body = `Cannot ${ctx.method} /${name}`;
    ctx.status_code = 404;
  });

  return app;
};
