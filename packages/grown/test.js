'use strict';

const IS_DEBUG = process.argv.slice(2).indexOf('--debug') > -1;
const IS_LIVE = process.argv.slice(2).indexOf('--live') > -1;

if (IS_DEBUG) {
  require('debug').enable('*');
}

const Grown = require('.');

Grown.use(require('./../router'));
Grown.use(require('./../render'));
Grown.use(require('./../test'));
Grown.use(require('./../conn'));

require('./dsl')(Grown);

Grown.module('Conn.Builder', {
  props: {
    version: require('./package.json').version,
  },
});

if (IS_DEBUG) {
  console.log('Grown instance', require('util').inspect(Grown));
}

const server = new Grown({
  env: process.env.NODE_ENV || 'development',
  cwd: process.cwd(),
});

Grown.module('Request', {
  install(ctx) {
    ctx.plug([
      Grown.Request.ElapsedTime,
    ]);
  },
});

Grown.module('Request.ElapsedTime', {
  _write(conn, template) {
    if (template.contents.indexOf('{elapsed}') === -1) {
      template.contents += `Time: ${this.timeDiff()}ms.`;
    } else {
      template.contents = template.contents.replace(/\{elapsed\}/g, this.timeDiff());
    }
  },

  timeDiff() {
    return ((new Date()) - this._start) / 1000;
  },

  before_send(e, ctx) {
    if (ctx.res) {
      ctx.res.setHeader('X-Response-Time', this.timeDiff());

      if (!ctx.render) {
        ctx.res.write(this.timeDiff());
      }
    }
  },

  install(ctx) {
    console.log('ELAPSED TIME', this.class);

    if (this.class === 'Grown.Request.ElapsedTime' || !this._render) {
      throw new Error('Include this module first');
    }

    ctx.on('request', () => {
      this._start = new Date();
    });
  },
});

Grown.module('Router.Mappings', {
  // fallthrough: true,
});

Grown.module('Render.Layout', {
  template: 'default',
});

Grown.module('Render.Views', {
  folders: [__dirname],
});

Grown.module('Application', {
  include: [
    Grown.Conn,
    Grown.Router.Mappings,
    Grown.Render.Views({
      include: [
        Grown.Request.ElapsedTime,
        Grown.Render.Layout,
      ],
    }),
    !IS_LIVE && Grown.Test.Request({
      include: [
        Grown.Test.Mock.Req,
        Grown.Test.Mock.Res,
      ],
    }),
  ],
});

server.plug([
  Grown.Application({
  }),
]);

server.get('/x', ctx => {
  ctx.append('head', '<!-- plain HTML -->');

  ctx.append('head', {
    // vnode-like
    meta: 'x',
    content: 'x',
    httpEquiv: true,
  });

  ctx.append('body', (state, h) => h('pre', null, 'OSOM'));

  ctx.navigation((state, h) => h('h1', null, state.title || 'Home'), {
    href: '/',
  });

  ctx.render('view');
});

server.get('/session', { to: 'Session#check' });
server.post('/session', { to: 'Session#create' });
server.delete('/session', { to: 'Session#destroy' });

server.get('/w', ctx => ctx.res.write('OK'));
server.get('/d', ctx => ctx.res.write(require('util').inspect(ctx)));

const path = (process.argv.slice(2)[0] || '').charAt() === '/'
  ? process.argv.slice(2)[0]
  : '/';

if (!IS_LIVE) {
  server.request(path, (err, conn) => {
    if (conn && conn.res) {
      console.log(conn.res.body);
    }

    if (err) {
      console.log(err.stack);
    }
  });
} else {
  server.listen(8080);
}

server.on('start', () => {
  console.log('Go!');
  console.log('---');
});
