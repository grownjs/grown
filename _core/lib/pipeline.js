function _next(promise, callback) {
  if (typeof callback === 'function') {
    return promise.then(callback);
  }

  return promise;
}

function _run(iterator) {
  return new Promise(function (resolve, reject) {
    function next(err, value) {
      if (err) {
        return reject(err);
      }

      var result = iterator.next(value);

      if (!result.done) {
        if (typeof result.value == 'function') {
          var _value = result.value();

          if (typeof _value.then === 'function' && typeof _value.catch === 'function') {
            _value
              .then(function (value) {
                next(undefined, value);
              })
              .catch(next);
          } else {
            next(undefined, value);
          }
        } else {
          next(err, value);
        }
      } else {
        resolve();
      }
    }

    next();
  });
}

module.exports = function _pipelineFactory(label, pipeline, _callback) {
  return function (conn, options) {
    var _pipeline = pipeline.slice();
    var _stack = [];

    function next(end) {
      var cb = _pipeline.shift();

      if (!cb) {
        end();
      } else {
        var value;

        _stack.push(cb.name);

        if (conn.res.finished || conn.body !== null) {
          // short-circuit
          return end();
        }

        conn.next = function (_resume) {
          if (!_pipeline.length) {
            return _next(Promise.resolve(conn), _resume);
          }

          var _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

          _pipeline = [];

          return _next(_dispatch(conn, options), _resume);
        };

        try {
          if (Array.isArray(cb.call) && typeof cb.call[1] === 'string') {
            value = cb.call[0][cb.call[1]](conn, options);
          } else if (typeof cb.call.prototype.next === 'function') {
            value = _run(cb.call(conn, options));
          } else {
            value = cb.call(conn, options);
          }
        } catch (e) {
          return end(e);
        }

        if (!value) {
          return next(end);
        }

        if (typeof value.then === 'function' && typeof value.catch === 'function') {
          value
            .then(function () {
              next(end);
            })
            .catch(function (error) {
              end(error);
            });
        } else {
          next(end);
        }
      }
    }

    return new Promise(function (resolve, reject) {
      next(function (err) {
        if (!err && conn.res.finished) {
          err = new Error('Conn Already Finished');
        }

        if (err) {
          err.data = err.data || [];
          err.text = err.text || [];
          err.pipeline = err.pipeline || [];

          Array.prototype.push.apply(err.pipeline, _stack);
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
          resolve(conn);
        }
      });
    });
  };
};
