var assert = require('assert');
var mock = require('./mock');

mock({
  app: {
    container: {
      options: {}
    }
  },
  host: {
    protocol: 'http',
    port: 8000
  },
  server: {
    instance: require('./run')
  },
  tests: {
    'it should responds to / with 404': function (req, res, next, client) {
      req.url = '/';

      client(req, res, function () {
        assert.equal(res.statusMessage, 'Not Found');
        assert.equal(res.statusCode, 404);
        next();
      });
    },
    'it should responds to /x with JSON': function (req, res, next, client) {
      req.url = '/x';

      client(req, res, function () {
        assert.equal(res._body, '{"input":{},"query":{},"params":{"value":"x"}}');
        assert.equal(res.statusMessage, 'OK');
        assert.equal(res.statusCode, 200);
        next();
      });
    }
  }
});
