// git clone https://github.com/pateketrueke/homegrown.git
// cd homegrown
// mkdir external && cd external
// git clone https://github.com/uWebSockets/uWebSockets.git
// cd uWebSockets
// make
// cd ..
// yarn
// yarn example uws

const uws = require('../external/uWebSockets/nodejs/dist/uws');

const server = require('..').new();

server.protocols.uws = {
  globalAgent: {
    defaultPort: process.env.PORT,
  },

  createServer(_options, _client) {
    if (typeof _options === 'function') {
      _client = _options;
      _options = null;
    }

    return {
      listen(port, host, callback) {
        const wss = new uws.Server({ nativeHttp: true, port: port });

        wss.on('connection', (ws) => {
          ws.terminate();
        });

        wss.on('error', (error) => {
          console.log('Cannot start server');
        });

        wss.onHttpRequest((socket, req) => {
          try {
            _client({
              url: req.url,
              body: null,
              method: req.verb === uws.HTTP_GET ? 'GET' : 'POST',
              headers: {
                host: 'localhost:5000',
              },
              getHeader(arg1) { req.getHeader(arg1); },
              setHeader(arg1, arg2) {},
            }, {
              end(arg1) { socket.end(arg1); },
              send(arg1) { socket.send(arg1); },
              getHeader(arg1) {},
              setHeader(arg1, arg2) {},
              finished: false,
              statusCode: 502,
              statusMessage: 'Not Implemented',
            }, () => console.log('DONE'));
          } catch (e) {
            console.log('ERR', e);
          }
        });

        callback();
      },
    };
  },
};

server.mount((conn) => {
  const start = new Date();

  return conn.next(() => {
    conn.body = `OK in ${(new Date() - start) / 1000}ms`;
  });
});

server.listen('uws://localhost:5000', (app) => {
  console.log('Listening on', app.location.href);
});
