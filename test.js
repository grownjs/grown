var Readable = require('stream').Readable;

module.exports = function (server) {
  var _fn;

  function makeRequest(next) {
    var app = server.listen('test://');

    var _opts = {
      end: false,
      body: null,
      buffer: [],
      headers: {}
    };

    var _req = new Readable();

    _req._read = function () {
      _opts.buffer.forEach(function (data) {
        _req.push(data);
      });

      _req.push(null);
    };

    // known interface
    _req.url = '/';
    _req.query = '';
    _req.method = 'GET';
    _req.headers = {};
    _req.headers = { host: app.location.host };

    // initial length
    _req.headers['content-length'] = 0;

    // test interface
    _req._pushData = function (data) {
      _opts.buffer.push(data);
      _req.headers['content-length'] += data.length;
    };

    next(_req, function (end) {
      _opts.end = end;

      if (_fn) {
        var _res = {};

        // known interface
        _res.finished = false;
        _res.statusCode = 200;
        _res.statusMessage = 'OK';

        _res.end = function (data) {
          _res.finished = true;
          _opts.body = data;

          return _res;
        };

        _res.getHeader = function (k) { return _opts.headers[k]; };
        _res.setHeader = function (k, v) { _opts.headers[k] = v; };

        // test interface
        _res._getBody = function () {
          return _opts.body;
        };

        _fn(_req, _res, function (e) {
          if (_opts.end && !_opts.end._finished) {
            _opts.end._finished = true;
            _opts.end(e, _res);
          }
        });
      }
    });
  }

  makeRequest.protocol = function () {
    return {
      createServer: function (_options, _client) {
        if (typeof _options === 'function') {
          _client = _options;
          _options = null;
        }

        _fn = _client;

        return {
          listen: function () {}
        };
      }
    };
  };

  makeRequest.fetch = function (method, path, opts) {
    return new Promise(function (resolve, reject) {
      makeRequest(function (req, next) {
        var _method = typeof method === 'string' && typeof path === 'string' ? method : 'get';
        var _path = typeof path === 'string' ? path : method || '/';
        var _opts = typeof path === 'object' ? _path : opts || {};

        if (typeof method === 'object') {
          _opts = method;
          _method = 'get';
          _path = '/';
        }

        req.url = _path;
        req.method = _method.toUpperCase();

        Object.keys(_opts).forEach(function (_key) {
          req[_key] = _opts[_key];
        });

        next(function (e, res) {
          if (e) {
            reject(e);
          } else {
            resolve(res);
          }
        });
      });
    });
  };

  return makeRequest;
};
