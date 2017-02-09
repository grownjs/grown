// git clone https://github.com/pateketrueke/homegrown.git
// cd homegrown
// mkdir external && cd external
// git clone https://github.com/uWebSockets/uWebSockets.git
// cd uWebSockets/nodejs
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
          res.finished = false;
          res.statusCode = 502;
          res.statusMessage = 'Not Implemented';

          const _writeHead = res.writeHead.bind(res);

          // noop
          res.writeHead = (status, headers) => {
            // FIXME
            // _writeHead(status || 200, headers || {});
          };

          _client(req, res, () => console.log('DONE'));
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
