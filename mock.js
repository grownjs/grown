module.exports = function (options) {
  options.server.instance.protocols[options.host.protocol] = {
    createServer: function (_options, _client) {
      if (typeof _options === 'function') {
        _client = _options;
        _options = null;
      }

      return {
        listen: function () {
          var _tests = Object.keys(options.tests).slice();
          var _errors = [];

          function next(done) {
            var _key = _tests.shift();
            var _cb = options.tests[_key];

            if (!_cb) {
              return done();
            }

            var req = {
              _data: null,
              url: '/',
              query: '',
              method: 'GET',
              headers: { host: '0.0.0.0:' + options.host.port },
              on: function (k, fn) { k === 'data' ? fn(req._data) : fn(); }
            };

            var res = {
              _headers: {},
              finished: false,
              statusCode: 200,
              statusMessage: 'OK',
              end: function (data) { res._body = data; },
              setHeader: function (k, v) { res._headers[k] = v; }
            };

            var start = new Date();
            var _pass;

            process.stdout.write('# ' + _key + ' ... ');

            _cb(req, res, function () {
              process.stdout.write((_pass !== false ? 'OK' : 'FAIL') + '  ' + ((new Date()) - start) + 'ms\n');
              next(done);
            }, function (req, res, _next) {
              options.server.instance.hosts[req.headers.host] = options.app;

              var _end = res.end;

              res.end = function () {
                _end.apply(null, arguments);
                res.end = _end;

                try {
                  _next();
                  _pass = true;
                } catch (e) {
                  _errors.push(e);
                  _pass = false;
                  next(done);
                }
              };

              _client(req, res);
            });
          }

          next(function () {
            if (_errors.length) {
              process.stdout.write('FAIL\n');
              _errors.forEach(function (err) {
                process.stdout.write(err.toString() + '\n');
              });
            }
          });
        }
      };
    },
    globalAgent: {
      defaultPort: options.host.port
    }
  };

  options.server.instance.listen(options.host.port);
};
