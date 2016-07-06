module.exports = function (server) {
  var _fn;

  function makeRequest(next) {
    var app = server.listen('test://');

    var _opts = {
      end: false,
      data: null,
      body: null,
      headers: {}
    };

    var req = {
      // test interface
      setData: function (data) {
        _opts.data = data;
      },

      // known interface
      url: '/',
      query: '',
      method: 'GET',
      headers: { host: app.location.host },
      on: function (k, fn) { k === 'data' ? fn(_opts.data) : fn(); }
    };

    var res = {
      // test interface
      getBody: function () {
        return _opts.body;
      },

      // known interface
      finished: false,
      statusCode: 200,
      statusMessage: 'OK',
      end: function (data) {
        res.finished = true;
        _opts.body = data;

        if (_opts.end) {
          _opts.end(res);
        }
      },
      getHeader: function (k) { return _opts.headers[k]; },
      setHeader: function (k, v) { _opts.headers[k] = v; }
    };

    next(req, function (end) {
      _opts.end = end;

      if (_fn) {
        _fn(req, res);
      }
    });
  }

  makeRequest.makeProtocol = function () {
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

  return makeRequest;
};
