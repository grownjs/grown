const Readable = require('stream').Readable;
const Writable = require('stream').Writable;

function mock($) {
  let _fn;

  $.protocols.test = {
    createServer(_options, _client) {
      if (typeof _options === 'function') {
        _client = _options;
        _options = null;
      }

      _fn = _client;

      return { listen(port, host, callback) { callback(); } };
    },
  };

  return function makeRequest(...args) {
    if (!args[0] || typeof args[0] === 'string' || typeof args[0] === 'object') {
      return new Promise((resolve) => {
        const [method, path, opts] = args;

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

    $.ctx.listen({ protocol: 'test' }).then((_server) => {
      const _opts = {
        end: false,
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

      args[0](_req, (end) => {
        _opts.end = end;

        /* istanbul ignore else */
        if (_fn) {
          const _res = new Writable();
          const _end = _res.end;

          // by-pass
          _res.end = (chunk) => {
            _res.finished = true;

            /* istanbul ignore else */
            if (chunk) {
              _opts.body = chunk;
            }

            _end.call(_res);

            return _res;
          };

          // known interface
          _res.finished = false;
          _res.statusCode = 501;
          _res.statusMessage = 'Not Implemented';

          // TODO: mocks
          _res.clearCookie = (k) => { delete _opts.cookies[k]; };
          _res.cookie = (k, v, o = {}) => { _opts.cookies[k] = { value: v, opts: o }; };
          _res.location = () => {};
          _res.redirect = () => {};
          _res.render = () => {};

          _res.type = (v) => { _opts.headers['content-type'] = v; };
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
          Object.defineProperty(_res, 'body', {
            get() {
              return _opts.body;
            },
            set() {
              throw new Error('Output body is already defined');
            },
          });

          Object.defineProperty(_res, 'cookies', {
            get() {
              return _opts.cookies;
            },
            set() {
              throw new Error('Response cookies are already defined');
            },
          });

          Object.defineProperty(_res, 'headers', {
            get() {
              return _opts.headers;
            },
            set() {
              throw new Error('Response headers are already defined');
            },
          });

          _fn(_req, _res, (e) => {
            /* istanbul ignore else */
            if (_opts.end && !_opts.end._finished) {
              _opts.end._finished = true;
              _opts.end(e, _res);
            }
          });
        }
      });
    });
  };
}

module.exports = () => {
  return ($) => {
    $.fetch = mock($);
  };
};
