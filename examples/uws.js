// git clone https://github.com/pateketrueke/homegrown.git
// cd homegrown
// mkdir external && cd external
// git clone https://github.com/uWebSockets/uWebSockets.git
// cd uWebSockets/nodejs
// make
// cd ../..
// yarn
// yarn example uws

const Homegrown = require('..')();

const $ = Homegrown.new();

$.extensions('Homegrown.conn.uws', require('./_uws'));

$.mount((conn) => {
  const start = new Date();

  return conn.next(() => {
    conn.resp_body = `OK in ${(new Date() - start) / 1000}ms`;
  });
});

$.listen('uws://localhost:5000')
.then((app) => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));
