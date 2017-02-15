const uws = require('../external/uWebSockets/nodejs/dist/uws');

module.exports = {
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
          res.statusCode = 501;
          res.statusMessage = 'Not Implemented';

          const _headers = {};

          res.setHeader = (key, value) => {
            _headers[key] = value;
          };

          res.writeHead = (status, headers) => {
            // FIXME: this eventually will be implemented on uws
            res.write(`HTTP/1.1 ${(status || res.statusCode || 200)} ${res.statusMessage}\n`);

            if (headers) {
              Object.keys(headers).forEach((key) => {
                _headers[key] = headers[key];
              });
            }

            Object.keys(_headers).forEach((key) => {
              res.write(`${key}: ${_headers[key]}\n`);
            });

            res.write('\n');
          };

          _client(req, res);
        } catch (e) {
          console.log('ERR', e.stack);
        }
      });
    },
  },
};
