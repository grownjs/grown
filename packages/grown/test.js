'use strict';

const IS_DEBUG = process.argv.slice(2).indexOf('--debug') > -1;
const IS_LIVE = process.argv.slice(2).indexOf('--live') > -1;

if (IS_DEBUG) {
  require('debug').enable('*');
}

const Grown = require('.');

Grown.use(require('./../router'));
Grown.use(require('./../test'));
Grown.use(require('./../conn'));

if (IS_DEBUG) {
  console.log('Grown instance', require('util').inspect(Grown));
}

const server = new Grown({
  env: process.env.NODE_ENV || 'development',
  cwd: process.cwd(),
});

server.plug([
  !IS_LIVE && Grown.Test,
  Grown.Router.Mappings({
    // fallthrough: true,
  }),
  Grown.module('RequestTime', {
    before_send(e, ctx) {
      const diff = (new Date()) - this._start;

      ctx.res.write(`\nTime: ${diff / 1000}ms.`);
    },
    install(ctx) {
      ctx.on('request', () => {
        this._start = new Date();
      });
    },
  }),
]);

const path = (process.argv.slice(2)[0] || '').charAt() === '/'
  ? process.argv.slice(2)[0]
  : '/';

if (!IS_LIVE) {
  server.request(path, (err, conn) => {
    console.log(conn.res.body);
    console.log('---');
    console.log('END');
  });
} else {
  server.listen(8080);
}

server.on('failure', (e, conn) => {
  conn.res.write(e.stack);
  conn.res.end();
});

server.on('start', () => {
  console.log('Go!');
  console.log('---');
});

