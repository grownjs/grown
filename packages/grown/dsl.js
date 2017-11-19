'use strict';

module.exports = Grown => {
  Grown.module('Application.BaseController', {
    title: 'Home',
    pipe(ctx) {
      ctx.navigation(this.title, {
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
};
