'use strict';

module.exports = Grown => {
  Grown.module('Application.BaseController', {
    title: 'Home',
    pipe(ctx) {
      ctx.navigation((state, h) => h('span', null, `${this.title} - ${ctx.version}`), {
        href: '/',
      });
    },
    methods: {
      check() {
        throw new Error('Not implemented');
      },
    },
  });

  Grown.module('Application.SessionController', {
    extend: [
      Grown.Application.BaseController,
    ],
    methods: {
      check(ctx) {
        ctx.render('view', {
          check: false,
        });
      },
    },
  });

  Grown.module('Router.Mappings', {
    before_routes(ctx, routes) {
      routes.forEach(r => {
        if (r.pipeline) {
          r.pipeline.unshift({
            type: 'function',
            name: 'set_util_context',
            call: () => { console.log(420); },
          });
        }
      });
    },
  });
};
