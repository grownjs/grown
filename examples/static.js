var server = require('homegrown')();

server.mount(require('serve-static')(__dirname));

server.listen(5000, function (app) {
  console.log('Listening on', app.location.href);
});
