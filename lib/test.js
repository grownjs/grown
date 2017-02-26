'use strict';

/* eslint-disable prefer-rest-params */

const debug = require('debug')('homegrown:test');

const MockReq = require('mock-req');
const MockRes = require('mock-res');

module.exports = ($) => {
  let _fn;

  debug('Initializating test protocol');

  $.extensions('Homegrown.conn.test', {
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

  return function makeRequest(url, method, options) {
    if (typeof url === 'object') {
      options = url;
      method = undefined;
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

    debug('Requesting %s %s', options.method, options.url);

    return new Promise((resolve, reject) => {
      $.listen({ protocol: 'test' }).then((_server) => {
        // override
        options.headers.host = _server.location.host;

        const _req = new MockReq(options);

        function done(err) {
          if (err) {
            debug('Error. %s', err.message);
            reject(err);
          } else {
            debug('Done. The request was ended');
            resolve();
          }
        }

        const _res = new MockRes(done);

        try {
          _res.on('error', done);
          _res.on('finish', done);

          _fn(_req, _res);
        } catch (e) {
          done(e);
        }
      });
    });
  };
};
