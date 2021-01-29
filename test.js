const Grown = require('.')();

const server = new Grown();

server.listen(8080);
server.mount(conn => {
  console.log(conn.req.method, conn.req.url);
  if (conn.req.url === '/die') {
    setTimeout(process.exit, 200);
  }
  conn.res.statusCode = 200;
  conn.res.end('OK\n');
});
