'use strict';

/* eslint-disable prefer-rest-params */

const Readable = require('stream').Readable;
const Writable = require('stream').Writable;

function _set(obj, k, v, desc) {
  Object.defineProperty(obj, k, {
    get() {
      return v[k];
    },
    set() {
      throw new Error(desc);
    },
  });
}

function mock($) {
  let _fn;

  $._protocols.test = {
    createServer(_options, _client) {
      if (typeof _options === 'function') {
        _client = _options;
        _options = null;
      }

      _fn = _client;

      return { listen(port, host, callback) { callback(); } };
    },
  };

  return function makeRequest() {
    const args = Array.prototype.slice.call(arguments);

    /* istanbul ignore else */
    if (!args[0] || typeof args[0] === 'string' || typeof args[0] === 'object') {
      return new Promise((resolve) => {
        const method = args[0];
        const path = args[1];
        const opts = args[2];

        return makeRequest((req, _next) => {
          let _method = typeof method === 'string' && typeof path === 'string' ? method : 'get';
          let _path = typeof path === 'string' ? path : method || '/';
          let _opts = typeof path === 'object' ? path : opts || {};

          /* istanbul ignore else */
          if (typeof method === 'object') {
            _opts = method;
            _method = 'get';
            _path = '/';
          }

          req.url = _path;
          req.method = _method.toUpperCase();
          req.httpVersionMajor = 1;
          req.httpVersionMinor = 0;

          Object.keys(_opts).forEach((_key) => {
            req[_key] = _opts[_key];
          });

          _next((e, res) => {
            Object.defineProperty(res, 'error', {
              get() {
                return e;
              },
              set() {
                throw new Error('Error cannot be set');
              },
            });

            resolve(res);
          });
        });
      });
    }

    $.listen({ protocol: 'test' }).then((_server) => {
      const _opts = {
        body: null,
        buffer: [],
        cookies: {},
        headers: {},
      };

      const _req = new Readable();

      _req._read = () => {
        _opts.buffer.forEach((data) => {
          _req.push(data);
        });

        _req.push(null);
      };

      // known interface
      _req.url = '/';
      _req.path = '';
      _req.host = '';
      _req.hostname = '';
      _req.query = '';
      _req.secure = false;
      _req.ip = '0.0.0.0';
      _req.method = 'GET';
      _req.headers = {};
      _req.headers = { host: _server.location.host };

      _req.get = _req.header = (k) => _req.headers[k];
      _req.set = (k, v) => { _req.headers[k] = v; };

      _req.param = () => {};
      _req.xhr = () => {};
      _req.is = () => {};

      // initial length
      _req.headers['content-length'] = 0;

      // test interface
      _req._pushData = (data) => {
        _opts.buffer.push(data);
        _req.headers['content-length'] += data.length;
      };

      args[0](_req, (done) => {
        /* istanbul ignore else */
        if (_fn) {
          const _res = new Writable();

          // known interface
          _res.finished = false;
          _res.statusCode = 200;
          _res.statusMessage = 'OK';

          // TODO: mocks
          _res.clearCookie = (k) => { delete _opts.cookies[k]; };
          _res.cookie = (k, v, o) => { _opts.cookies[k] = { value: v, opts: o || {} }; };
          _res.location = () => {};
          _res.redirect = () => {};
          _res.render = () => {};

          _res.type = (v) => { _opts.headers['Content-Type'] = v; };
          _res.format = () => {};

          _res.send = () => {};
          _res.json = () => {};
          _res.jsonp = () => {};
          _res.status = (s) => { _res.statusCode = s; };
          _res.sendStatus = (s) => { _res.status(s); _res.send(); };

          _res.writeHead = (s, m, h) => {
            if (typeof s === 'number') {
              _res.statusCode = s;
            }

            if (typeof m === 'object') {
              h = m;
              m = '';
            }

            if (m) {
              _res.statusMessage = m;
            }

            if (h) {
              Object.keys(h).forEach((key) => {
                _opts.headers[key] = h[key];
              });
            }
          };

          _res.write = (v) => { _opts.body = (_opts.body || '') + v; };

          _res.removeHeader = (k) => { delete _opts.headers[k]; };
          _res.get = _res.getHeader = (k) => _opts.headers[k];
          _res.set = _res.header = _res.setHeader = (k, v) => { _opts.headers[k] = v; };

          // test interface
          _set(_res, 'body', _opts, 'Output body is already defined');
          _set(_res, 'cookies', _opts, 'Response cookies are already defined');
          _set(_res, 'headers', _opts, 'Response headers are already defined');

          try {
            _fn(_req, _res, (e) => {
              // wait for complete the pipeline on next tick
              setTimeout(() => done(e, _res));
            });
          } catch (e) {
            done(e, _res);
          }
        }
      });
    });
  };
}

module.exports = function $test() {
  return ($) => {
    $.fetch = mock($);
  };
};
