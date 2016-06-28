var server = require('./_core')();

// x-response-time
server.mount(function xResponseTime(conn) {
  var _start = new Date();

  return conn.next(function () {
    var ms = (new Date()) - _start;

    conn.set('x-response-time', ms + 'ms');
  });
});

server.use(require('./_core/router')(process.cwd()));

server.mount(function MyApp(conn) {
  if (conn.req.method === 'GET' && conn.req.url === '/_routerInfo') {
    var _data = [];

    conn.app.routes.forEach(function (route) {
      _data.push(route);
    });

    conn.body = {
      routeMappings: _data
    };
  }
});

module.exports = server;

// server.listen(8000);
