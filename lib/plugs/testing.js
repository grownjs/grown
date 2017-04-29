'use strict';

const debug = require('debug')('grown:test');

function _set(obj, k, v) {
  Object.defineProperty(obj, k, {
    get: v,
  });
}

module.exports = $ => {
  let _fn;

  const MockReq = require('mock-req');
  const MockRes = require('mock-res');

  debug('Initializating test protocol');

  $.extensions('Conn.test', {
    props: {
      globalAgent: {
        defaultPort: process.env.PORT || 80,
      },
    },
    methods: {
      createServer(_options, _client) {
        if (typeof _options === 'function') {
          _client = _options;
          _options = null;
        }

        _fn = _client;

        return { listen(port, host, callback) { callback(); } };
      },
    },
  });

  function run(options, callback) {
    return new Promise((resolve, reject) => {
      $.listen({ protocol: 'test' }).then(_server => {
        function next(req, onFinish) {
          const resp = new MockRes(() => onFinish(null, resp));

          resp.on('error', err => onFinish(err, resp));

          resp.cookies = {};
          resp.clearCookie = k => { delete resp.cookies[k]; };
          resp.cookie = (k, v, o) => { resp.cookies[k] = { value: v, opts: o || {} }; };

          _set(resp, 'body', () => resp._getString());
          _set(resp, 'json', () => resp._getJSON());

          _fn(req, resp);
        }

        debug('Requesting %s %s', options.method, options.url);

        options.headers.host = _server.location.host;

        try {
          const req = typeof callback === 'function'
            ? callback(new MockReq(options))
            : new MockReq(options);

          next(req, (err, resp) => {
            if (err) {
              debug('Error. %s', err.message);
              reject(err);
            } else {
              debug('Done. The request was ended');
              resolve(resp);
            }
          });
        } catch (e) {
          debug('Failed. %s', e.message);
          reject(e);
        }
      });
    });
  }

  return function makeRequest(url, method, options) {
    let callback;

    if (typeof url === 'function') {
      callback = url;
      url = undefined;
    }

    if (typeof url === 'object') {
      options = url;
      url = undefined;
    }

    if (typeof method === 'object') {
      options = method;
      method = undefined;
    }

    options = options || {};
    options.url = url || options.url || '/';
    options.method = (method || options.method || 'get').toUpperCase();
    options.headers = options.headers || {};

    return run(options, callback);
  };
};
