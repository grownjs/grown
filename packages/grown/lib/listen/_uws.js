'use strict';

module.exports = {
  globalAgent: {
    defaultPort: process.env.PORT || 8080,
  },
  createServer(_options, _client) {
    /* istanbul ignore else */
    if (typeof _options === 'function') {
      _client = _options;
      _options = null;
    }

    return require('uws').http.createServer((req, res) => {
      try {
        req.headers = req.headers || {};
        req.headers.host = req.headers.host || '0.0.0.0';

        _client(req, res);
      } catch (e) {
        console.log(e.stack);
      }
    });
  },
};
