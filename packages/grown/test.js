'use strict';

require('debug').enable('*');

const IS_LIVE = process.argv.slice(2).indexOf('--live') > -1;

const Grown = require('.');

Grown.use(require('./../router'));
Grown.use(require('./../test'));
Grown.use(require('./../conn'));

const server = new Grown({
  env: process.env.NODE_ENV || 'development',
  cwd: process.cwd(),
});

Grown.module('Example', {
  props: {
    TRUTH: 42,
  },
  methods: {
    call(ctx) {
      ctx.res.write('0\n');
    },
  },
});

server.plug([
  IS_LIVE
    ? null
    : [Grown.Test],
  // Grown.Conn,
  Grown.Router.Base,
  Grown.Router.HTTP,
  // Grown.Router.Views,
  Grown.Router.Routes({
    router(map) {
      return map()
        .get('/', 'Example');
    },
  }),
  // Grown.Router.Pipeline,
  // Grown.Router.Middleware,
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
  if (ctx.script_name) {
    ctx.res.write(`${ctx.script_name}\n`);
  } else {
    ctx.res.write('N/A\n');
  }
});

server.get('/mix', [
  Grown.Example({
    props: {
      TRUTH: 31,
    },
    methods: {
      call(ctx, options) {
        this.super.call(ctx, options);
        ctx.res.write(`${this.TRUTH} / ${this.super.TRUTH}\n`);
      },
    },
  }),
  ctx => ctx.res.write('1\n'),
  ctx => ctx.res.write('2\n'),
]);

if (IS_LIVE) {
  server.listen(8080, ctx => {
    console.log('START', ctx.location.href);
  });
} else {
  server.request('/mix', (e, ctx) => {
    console.log(ctx.res.body);
  }).then(() => Grown.Test.Request.request.call(server, '/x', (e, ctx) => {
    console.log(ctx.res.body);
  })).catch(e => {
    console.log(e.stack);
  });
}
