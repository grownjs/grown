// git clone https://github.com/pateketrueke/grown.git
// cd grown
// mkdir external && cd external
// git clone https://github.com/uWebSockets/uWebSockets.git
// cd uWebSockets/nodejs
// make
// cd ../..
// yarn
// yarn example uws

const Grown = require('..');

Grown.new({
  mount: [
    (conn) => {
      const start = new Date();

      return conn.next(() => {
        if (conn.request_path === '/') {
          conn.resp_body = `OK in ${(new Date() - start) / 1000}ms`;
        }
      });
    },
  ],
})
.listen('uws://0.0.0.0:5000')
.then((app) => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));
