var server = require('./_core')();
var app = server.listen(8000);

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
  if (conn.req.method === 'GET' && conn.req.url === '/x') {
    conn.body = (conn.body || ':O').replace(':)', ':D');
  }
});

console.log('Listening at ' + app.location.href);
