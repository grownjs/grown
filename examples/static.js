const $ = require('..').new();

$.ctx.mount(require('serve-index')(__dirname));
$.ctx.mount(require('serve-static')(__dirname));

$.ctx.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});
