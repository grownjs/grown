// var server = require('homegrown')();
var server = require('./_core')();

function getValue(n) {
  // return function () {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(n);
      }, 1000);
    });
//   };
}

// x-response-time
// server.mount(function* xResponseTime(conn) {
//   var _start = new Date();

//   console.log('0');

//   console.log(yield getValue(42));

//   yield conn.next;

//   console.log('1');

//   var ms = (new Date()) - _start;

//   conn.set('x-response-time', ms + 'ms');
// });

server.mount(function xResponseTime(conn) {
  var _start = new Date();

  console.log('0');

  var value = getValue(42);

  return value.then(function (result) {
    console.log(result);

    return conn.next(function () {
      console.log('1');

      var ms = (new Date()) - _start;

      conn.set('x-response-time', ms + 'ms');
    });
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

    console.log('...');
  }
});

module.exports = server;

server.listen(8000);
