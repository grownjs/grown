'use strict';

const debug = require('debug')('grown:pipeline');

const middleware = require('./middleware');

function _when(promise, callback) {
  /* istanbul ignore else */
  if (typeof callback === 'function') {
    promise = promise.then(callback);
  }

  return promise;
}

function _run(task, state, options) {
  debug('#%s Executing %s handler <%s>', state.pid, task.type, task.name);

  try {
    /* istanbul ignore else */
    if (task.filter && (task.filter(state, options) === false)) {
      return;
    }
  } catch (e) {
    debug('#%s Skip. %s', state.pid, e.message);
    throw e;
  }

  switch (task.type) {
    case 'method': {
      const instance = task.call[0];
      const method = task.call[1];

      return instance[method](state, options);
    }

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

          const result = _iterator.next(value, options);

          if (!result.halted && result.value) {
            /* istanbul ignore else */
            if (typeof result.value.then === 'function'
              && typeof result.value.catch === 'function') {
              _when(result.value, _value => {
                next(undefined, _value);
              }).catch(next);
              return;
            }

            const _next =
              (typeof result.value === 'function' || result.value.call || result.value.next)
                ? middleware(result.value, options, `${task.name}.${task.type}`)
                : result;

            next(undefined, typeof _next.value === 'undefined'
              ? _run(_next, state, options)
              : _next.value);
          } else {
            resolve(result.value);
          }
        }

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

    let cb;

    function next(end) {
      cb = _pipeline.shift();

      if (!cb) {
        end();
      } else {
        let value;

        _stack.push(cb.name);

        /* istanbul ignore else */
        if (state.halted) {
          debug('#%s OK. Pipeline halted before <%s>', state.pid, cb.name);

          // short-circuit
          end();
          return;
        }

        // allow continuation
        state.next = _resume => {
          /* istanbul ignore else */
          if (!_pipeline.length) {
            return _when(Promise.resolve(state), _resume);
          }

          const _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

          _pipeline = [];

          return _when(_dispatch(state, options), _resume);
        };

        try {
          value = _run(cb, state, options);
        } catch (e) {
          debug('#%s Pipeline <%s> errored on <%s>: %s', state.pid, label, cb.name, e.message);

          e.summary = `Pipeline ${cb.name}${cb.call ? `.${cb.call[1]}` : ''} was errored.`;

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
            .then(() => next(end))
            .catch(end);
        } else {
          next(end);
        }
      }
    }

    return new Promise((resolve, reject) => {
      next(err => {
        let retval;

        /* istanbul ignore else */
        if (err) {
          const stack = _stack.slice();
          const broken = stack.pop();

          err.pipeline = [stack, broken, _pipeline.map(p => p.name)];

          debug('#%s Wait. Pipeline <%s> [%s] was errored', state.pid, label, err.pipeline[1]);
        }

        /* istanbul ignore else */
        if (!err && _callback) {
          try {
            retval = _callback(err, state, options);
          } catch (_err) {
            err = _err;
          }
        }

        /* istanbul ignore else */
        if (!err && retval
          && typeof retval.then === 'function'
          && typeof retval.catch === 'function') {
          retval.catch(reject).then(() => resolve(state));
          return;
        }

        if (err) {
          reject(err);
        } else {
          resolve(state);
        }
      });
    })
      .catch(err => {
        if (_callback) {
          return _callback(err, state, options);
        }

        throw err;
      });
  };
};
