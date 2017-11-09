'use strict';

require('debug').enable('*');

const Grown = require('./_plugs/grown');

Grown.use(require('./_plugs/router'));
Grown.use(require('./_plugs/conn'));

const server = new Grown({
  env: process.env.NODE_ENV || 'development',
  cwd: process.cwd(),
});

Grown.module('Example', {
  methods: {
    call(ctx) {
      ctx.res.write('0\n');
    },
  },
});

server.plug([
  // Grown.Conn,
  // Grown.Router,
  Grown.Router.HTTP,
  {
    before_send(ctx) {
      ctx.res.write('\nBEFORE_SEND');
    },
  },
]);

server.mount((ctx, options) =>
  ctx.next(() => {
    ctx.res.write(`ENV: ${options('env')}`);
  }));

server.get('/x', ctx => {
  ctx.res.write(`${ctx.script_name}\n`);
});

console.log(new Grown.Example());

server.get('/mix', [
  Grown.Example,
  ctx => ctx.res.write('1\n'),
  ctx => ctx.res.write('2\n'),
]);

server.listen(8080, ctx => {
  console.log('START', ctx.location.href);
});
