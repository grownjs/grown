// git clone https://github.com/pateketrueke/homegrown.git
// cd homegrown
// mkdir external && cd external
// git clone https://github.com/uWebSockets/uWebSockets.git
// cd uWebSockets
// make
// cd ../..
// yarn
// yarn example uws

const uws = require('../external/uWebSockets/nodejs/dist/uws');

require('debug').enable('homegrown,homegrown:*');

const Homegrown = require('..')();

const $ = Homegrown.new();

$.extensions('Homegrown.conn.uws', {
  props: {
    globalAgent: {
      defaultPort: process.env.PORT,
    },
  },
  methods: {
    createServer(_options, _client) {
      if (typeof _options === 'function') {
        _client = _options;
        _options = null;
      }

      return uws.http.createServer((req, res) => {
        try {
          // TODO: wrap this
          console.log(res.on);
          res.send = () => {};
          res.getHeader = () => {};
          res.setHeader = () => {};
          res.finished = false;
          res.statusCode = 502;
          res.statusMessage = 'Not Implemented';

          _client({
            url: req.url,
            body: null,
            method: req.verb === uws.HTTP_GET ? 'GET' : 'POST',
            headers: {
              host: 'localhost:5000',
            },
            getHeader(arg1) {},
            setHeader(arg1, arg2) {},
          }, res, () => console.log('DONE'));
        } catch (e) {
          console.log('ERR', e.stack);
        }
      });
    },
  },
});

$.mount((conn) => {
  const start = new Date();

  return conn.next(() => {
    conn.resp_body = `OK in ${(new Date() - start) / 1000}ms`;
  });
});

$.listen('uws://localhost:5000', (app) => {
  console.log('Listening on', app.location.href);
});
