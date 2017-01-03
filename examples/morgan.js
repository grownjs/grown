const $ = require('..').new();

$.ctx.mount(require('morgan')('dev'));

$.ctx.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});
