'use strict';

const IS_DEBUG = process.argv.slice(2).indexOf('--debug') > -1;
// const IS_LIVE = process.argv.slice(2).indexOf('--live') > -1;

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
  router: {
    fallthrough: true,
  },
});

server.plug([
  Grown.Test,
  Grown.Router,
]);

server.get('/static', ctx => ctx.res.write('STATIC'));
server.get('/prefix/*_', ctx => ctx.res.write(`_: ${JSON.stringify(ctx.req.params)}`));
server.get('/:x', ctx => ctx.res.write(`X: ${JSON.stringify(ctx.req.params)}`));
server.get('/:_x/:y', ctx => ctx.res.write(`Y: ${JSON.stringify(ctx.req.params)}`));
server.get('/:x/:y/:z', ctx => ctx.res.write(`Z: ${JSON.stringify(ctx.req.params)}`));
server.get('/*any', ctx => ctx.res.write(`ANY: ${JSON.stringify(ctx.req.params)}`));

const path = (process.argv.slice(2)[0] || '').charAt() === '/'
  ? process.argv.slice(2)[0]
  : '/';

server.request(path, (err, conn) => {
  console.log(conn.res.body);
});
