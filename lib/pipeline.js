'use strict';

const debug = require('debug')('homegrown:pipeline');

const buildFactory = require('./factory');

function _when(promise, callback) {
  /* istanbul ignore else */
  if (typeof callback === 'function') {
    promise = promise.then(callback);
  }

  return promise;
}

function _run(task, state, options) {
  debug('Executing task %s (%s)', task.name, task.type);

  switch (task.type) {
    case 'method':
      return task.call[0][task.call[1]](state, options);

    case 'x-function':
    case 'function':
      return task.call(state, options);

    case 'iterator':
    case 'generator': {
      const _iterator = task.type === 'generator' ? task.call(state, options) : task.call;

      return new Promise((resolve, reject) => {
        function next(err, value) {
          /* istanbul ignore else */
          if (err) {
            reject(err);
            return;
          }

          debug('Trying to resolve %s value', task.type);

          const result = _iterator.next(value, options);

          if (!result.halted && result.value) {
            /* istanbul ignore else */
            if (typeof result.value.then === 'function'
              && typeof result.value.catch === 'function') {
              _when(result.value, (_value) => {
                next(undefined, _value);
              }).catch(next);
              return;
            }

            debug('Done. Trying to build a new task');

            const _next =
              (typeof result.value === 'function' || result.value.call || result.value.next)
              ? buildFactory(result.value, options, `${task.name}.${task.type}`)
              : result;

            next(undefined, typeof _next.value === 'undefined'
              ? _run(_next, state, options)
              : _next.value);
          } else {
            debug('Done. The %s was successfully ended', task.type);

            resolve(result.value);
          }
        }

        debug('Wait. Executing %s function', task.type);

        next(undefined, state);
      });
    }

    default:
      throw new Error(`Unsupported '${task.type}' pipeline`);
  }
}

module.exports = function _pipelineFactory(label, pipeline, _callback) {
  /* istanbul ignore else */
  if (!label) {
    throw new Error(`Label for pipelines are required, given '${label}'`);
  }

  /* istanbul ignore else */
  if (!Array.isArray(pipeline)) {
    throw new Error(`The pipeline must be an array, given '${pipeline}'`);
  }

  /* istanbul ignore else */
  if (_callback && typeof _callback !== 'function') {
    throw new Error(`The callback must be a function, given '${_callback}'`);
  }

  return function $pipeline(state, options) {
    state = state || {};
    options = options || {};

    /* istanbul ignore else */
    if (state.halted) {
      throw new Error(`Pipeline '${label}' Already Finished`);
    }

    // slice to keep original pipeline unmodified
    let _pipeline = pipeline.slice();

    // callstack for debug
    const _stack = [];

    function next(end) {
      const cb = _pipeline.shift();

      if (!cb) {
        end();
      } else {
        let value;

        _stack.push(cb.name);

        /* istanbul ignore else */
        if (state.halted) {
          // short-circuit
          end();
          return;
        }

        // allow continuation
        state.next = (_resume) => {
          /* istanbul ignore else */
          if (!_pipeline.length) {
            return _when(Promise.resolve(state), _resume);
          }

          debug('Wait. Trying to resolve the pending pipeline');

          const _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

          _pipeline = [];

          return _when(_dispatch(state, options), _resume);
        };

        try {
          value = _run(cb, state, options);
        } catch (e) {
          end(e);
          return;
        }

        /* istanbul ignore else */
        if (!value) {
          next(end);
          return;
        }

        if (typeof value.then === 'function' && typeof value.catch === 'function') {
          value
            .then(() => {
              next(end);
            })
            .catch(end);
        } else {
          next(end);
        }
      }
    }

    debug('Initializing %s pipeline with %s task%s',
      label,
      pipeline.length,
      pipeline.length === 1 ? '' : 's');

    return new Promise((resolve, reject) => {
      next((err) => {
        debug('Done. The %s pipeline was successfully ended', label);

        /* istanbul ignore else */
        if (err) {
          err.pipeline = err.pipeline || [];
          Array.prototype.push.apply(err.pipeline, _stack.reverse());
        }

        /* istanbul ignore else */
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
