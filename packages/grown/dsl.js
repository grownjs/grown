'use strict';

module.exports = Grown => {
  Grown.module('Application.BaseController', {
    pipe(ctx) {
      ctx.navigation('Home', {
        href: '/',
      });
    },
  });

  Grown.module('Application.SessionController', {
    include: [
      Grown.Application.BaseController,
    ],
    pipe() {
      console.log('DO SOMETHING ELSE');
    },
    methods: {
      check(ctx) {
        ctx.render('view');
      },
    },
  });
};
