const server = require('..').new();

server.mount(require('morgan')('dev'));

server.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});
