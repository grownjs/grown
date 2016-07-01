var buildFactory = require('./factory');

/* global Promise */
if (typeof Promise === 'undefined') {
  global.Promise = require('es6-promise').Promise;
}

function _when(promise, callback) {
  if (typeof callback === 'function') {
    return promise.then(callback);
  }

  return promise;
}

function _run(task, state, options) {
  switch (task.type) {
    case 'method':
      return task.call[0][task.call[1]](state, options);

    case 'function':
      return task.call(state, options);

    case 'iterator':
    case 'generator':
      var _iterator = task.type === 'generator' ? task.call(state, options) : task.call;

      return new Promise(function (resolve, reject) {
        function next(err, value) {
          if (err) {
            return reject(err);
          }

          var result = _iterator.next(value, options);

          if (!result.done) {
            var _scalar = typeof result.value === 'string' || typeof result.value === 'number' || typeof result.value === 'boolean';

            if (_scalar || Array.isArray(result.value) || !result.value) {
              return next(undefined, result.value);
            }

            var _next = (typeof result.value === 'function' || result.value.call || result.value.next)
              ? buildFactory(result.value) : result;

            if (_next.value) {
              return next(undefined, _next.value);
            }

            var _value = _run(_next, state, options);

            if (typeof _value.then === 'function' && typeof _value.catch === 'function') {
              _value
                .then(function (value) {
                  next(undefined, value);
                })
                .catch(next);
            } else {
              next(undefined, _value);
            }
          } else {
            resolve(result.value);
          }
        }

        next(undefined, state);
      });
  }
}

module.exports = function _pipelineFactory(label, pipeline, _callback) {
  return function (state, options) {
    var _pipeline = pipeline.slice();
    var _stack = [];

    function next(end) {
      var cb = _pipeline.shift();

      if (!cb) {
        end();
      } else {
        var value;

        _stack.push(cb.name);

        if (state.done) {
          // short-circuit
          return end();
        }

        state.next = function (_resume) {
          if (!_pipeline.length) {
            return _when(Promise.resolve(state), _resume);
          }

          var _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

          _pipeline = [];

          return _when(_dispatch(state, options), _resume);
        };

        try {
          value = _run(cb, state, options);
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
        if (!err && state.done) {
          err = new Error('state Already Finished');
        }

        if (err) {
          err.pipeline = err.pipeline || [];
          Array.prototype.push.apply(err.pipeline, _stack);
        }

        if (_callback) {
          try {
            _callback(err, state, options);
          } catch (_err) {
            err = _err;
          }
        }

        if (err) {
          reject(err);
        } else {
          resolve(state);
        }
      });
    });
  };
};
