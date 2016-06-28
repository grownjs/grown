module.exports = function _pipelineFactory(label, pipeline, _callback) {
  return function (conn, options) {
    var _pipeline = pipeline.slice();
    var _stack = [];

    function next(done) {
      var cb = _pipeline.shift();

      if (!cb) {
        done();
      } else {
        var value;

        _stack.push(cb.name);

        if (conn.body !== null) {
          // short-circuit
          return done();
        }

        if (conn.res.finished) {
          return done(new Error('TOO EARLY'));
        }

        conn.next = _pipeline.length ? function (_resume) {
          var _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

          _pipeline = [];

          var _promise = _dispatch(conn, options);

          if (typeof _resume === 'function') {
            return _promise.then(_resume);
          }

          return _promise;
        } : function _next(_resume) {
          return Promise.resolve(typeof _resume === 'function' ? _resume() : undefined);
        };

        try {
          if (Array.isArray(cb.call)) {
            value = cb.call[0][cb.call[1]](conn, options);
          } else {
            value = cb.call(conn, options);
          }
        } catch (e) {
          return done(e);
        }

        if (!value) {
          return next(done);
        }

        if (typeof value.then === 'function' && typeof value.catch === 'function') {
          value
            .then(function () {
              next(done);
            })
            .catch(function (error) {
              done(error);
            });
        } else {
          next(done);
        }
      }
    }

    return new Promise(function (resolve, reject) {
      next(function (err) {
        if (err) {
          err.data = err.data || [];
          err.text = err.text || [];
          err.pipeline = err.pipeline || [];

          Array.prototype.push.apply(err.pipeline, _stack);
        }

        if (!err && conn.res.finished) {
          err = new Error('TOO EARLY');
          err.pipeline = _stack;
        }

        if (_callback) {
          try {
            _callback(err, conn, options);
          } catch (_err) {
            err = _err;
          }
        }

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
};
