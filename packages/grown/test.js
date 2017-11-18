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

Grown.module('Conn.Mock', {
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
      template.contents += this.timeDiff();
    } else {
      template.contents = template.contents.replace(/\{elapsed\}/g, this.timeDiff());
    }
  },

  timeDiff() {
    const diff = (new Date()) - this._start;

    return `Time: ${diff / 1000}ms.`;
  },

  before_send(e, ctx) {
    if (ctx.render) {
      return;
    }

    if (ctx.res) {
      ctx.res.write(this.timeDiff());
    }
  },

  install(ctx) {
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
    IS_LIVE && {
      mixins: [
        Grown.Conn.Mock,
      ],
    },
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

server.plug(Grown.Application);

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

  ctx.render('view', {
    title: 'OSOM!',
  });
});

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

server.on('before_send', err => {
  if (err) {
    console.log(err.stack || err);
  }
});

server.on('failure', (err, conn) => {
  if (conn && conn.res) {
    conn.res.write(err.stack);
    conn.res.end();
  } else {
    throw err;
  }
});

server.on('start', () => {
  console.log('Go!');
  console.log('---');
});
