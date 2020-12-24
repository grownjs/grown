'use strict';

const path = require('path');
const fs = require('fs');

/* istanbul ignore file */

const USAGE_INFO = `

  Runs a web-server

  --dev  Optional. Spawn live-server and proxy

  Examples:
    grown serve --dev

`;

module.exports = {
  description: USAGE_INFO,
  async callback(Grown) {
    Grown.use(require('@grown/server'));
    Grown.use(require('@grown/conn'));

    const PORT = parseInt(Grown.argv.flags.port || '8080', 10);
    const devPort = Grown.argv.flags.dev ? PORT + 10 : PORT;
    const app = new Grown();

    app.plug(Grown.Conn);
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

    app.listen(devPort, () => {
      Grown.Logger.getLogger()
        .printf('\r{% info http://localhost:%s %}\r\n', PORT);
    });

    if (devPort !== PORT) {
      const userArgs = process.argv.slice(3);
      const proxyArgs = [`--proxy=/api:http://localhost:${devPort}`];

      Grown.CLI._exec(['npx', 'live-server', 'public', '--quiet', '--no-browser', ...userArgs, ...proxyArgs]);
    }
  },
};
