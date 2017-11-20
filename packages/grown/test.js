'use strict';

const IS_DEBUG = process.argv.slice(2).indexOf('--debug') > -1;
const IS_LIVE = process.argv.slice(2).indexOf('--live') > -1;

if (IS_DEBUG) {
  require('debug').enable('*');
}

const Grown = require('.');

Grown.use(require('@grown/tarima'));
Grown.use(require('@grown/static'));
Grown.use(require('@grown/router'));
Grown.use(require('@grown/render'));
Grown.use(require('@grown/test'));
// Grown.use(require('@grown/conn'));
Grown.use(require('./dsl'));

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

Grown.module('Router.Mappings', {
  // fallthrough: true,
});

Grown.module('Render.Layout', {
  template: 'default',
});

Grown.module('Render.Views', {
  include: [
    Grown.Render.Layout,
  ],
  view_folders: [__dirname],
});

// Grown.module('Static', {
//   static_folders: [
//     __dirname,
//     {
//       at: '/modules',
//       from: `${__dirname}/node_modules`,
//     },
//   ],
// });

Grown.module('Tarima', {
  src_folders: [
    {
      at: '/assets',
      from: __dirname,
      assets: '',
      content: '',
    },
  ],
});

Grown.module('Router.Controllers', {
  controller_lookup: 'Application.%sController',
});

server.plug([
  !IS_LIVE
    && Grown.Test,
  Grown.Conn,
  Grown.Static,
  Grown.Tarima,
  Grown.Render.Views,
  Grown.Router.Mappings,
  Grown.Router.Controllers,
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

  ctx.render('view', Grown.Application);
});

server.get('/y', ctx => {
  return new Promise(ok => {
    setTimeout(() => {
      ctx.res.write('WUT');
      ok();
    }, 10000);
  });
});

server.get('/session', 'Session#check');
server.post('/session', 'Session#create');
server.delete('/session', 'Session#destroy');

server.get('/w', ctx => ctx.res.write('OK'));
server.get('/d', ctx => ctx.res.write(require('util').inspect(ctx)));

const path = (process.argv.slice(2)[0] || '').charAt() === '/'
  ? process.argv.slice(2)[0]
  : '/';

server.on('before_send', err => {
  if (err) {
    console.log(err.stack);
  }
});

server.on('failure', err => {
  console.log(err.stack);
});

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
