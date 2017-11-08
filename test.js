const Grown = require('./_plugs/grown');

const server = new Grown({
  env: process.env.NODE_ENV || 'testing',
  cwd: process.cwd(),
});

Grown.module('Router', {
  props: {
    key: 'value',
  },
});

server.plug([
  Grown.Conn,
  Grown.Router,
]);

server.mount(ctx =>
  ctx.next(() => {
    console.log('DONE', ctx.routes);
    console.log('DONE', ctx.key);
    console.log('DONE', ctx.id);
  }));

server.get('/', ctx => {
  console.log('GOT', ctx.req.url);
});

server.listen(3001, ctx => {
  console.log('START', ctx);
});
