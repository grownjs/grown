module.exports = function (server) {
  var _fn;

  function makeRequest(next) {
    var app = server.listen('test://');

    var _end;

    var req = {
      _data: null,
      url: '/',
      query: '',
      method: 'GET',
      headers: { host: app.location.host },
      on: function (k, fn) { k === 'data' ? fn(req._data) : fn(); }
    };

    var res = {
      _headers: {},
      finished: false,
      statusCode: 200,
      statusMessage: 'OK',
      end: function (data) {
        res._body = data;

        if (_end) {
          _end(res);
        }
      },
      setHeader: function (k, v) { res._headers[k] = v; }
    };

    next(req, function (end) {
      _end = end;

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

        return {
          listen: function () {
            _fn = _client;
          }
        };
      }
    };
  };

  return makeRequest;
};
