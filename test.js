'use strict';

const Grown = require('./_plugs/grown');

Grown.use(require('./_plugs/router'));
Grown.use(require('./_plugs/conn'));

const server = new Grown({
  env: process.env.NODE_ENV || 'testing',
  cwd: process.cwd(),
});

server.plug([
  Grown.Conn,
  Grown.Router,
  Grown.Router.HTTP,
]);

server.mount((ctx, options) =>
  ctx.next(() => {
    ctx.resp_body = options('env');
  }));

server.get('/x', ctx => {
  console.log('GOT', ctx.req.url);
});

server.listen(3001, ctx => {
  console.log('START', ctx);
});

