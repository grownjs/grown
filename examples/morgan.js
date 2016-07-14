var server = require('homegrown')();

server.mount(require('morgan')('dev'));

server.listen(5000, function (app) {
  console.log('Listening on', app.location.href);
});
