const server = require('..').new();

server.mount(require('serve-index')(__dirname));
server.mount(require('serve-static')(__dirname));

server.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});
