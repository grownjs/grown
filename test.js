const Grown = require('./grown');

const server = new Grown({
  env: process.env.NODE_ENV || 'testing',
  cwd: process.cwd(),
});

Grown.module('Router', {
  props: {
    key: 'value',
  },
})

server.plug([
  Grown.Conn,
  Grown.Router,
]);

server.mount(ctx => {
  console.log('>>', ctx);
});

server.get('/', ctx => {
  console.log('GOT', ctx);
});

server.listen(3001, ctx => {
  console.log('START', ctx);
  // ctx.close();
});
