'use strict';

function _expressMiddleware(callback) {
  return conn => {
    /* istanbul ignore else */
    if (callback.length === 4) {
      return conn.next().catch(error => {
        return new Promise((resolve, reject) => {
          callback(error, conn.req, conn.res, _error => {
            if (_error) {
              reject(_error);
            } else {
              resolve();
            }
          });
        });
      });
    }

    return new Promise((resolve, reject) => {
      callback(conn.req, conn.res, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
}

module.exports = (Factory, params, _name) => {
  const _suffix = _name ? ` (${_name})` : '';

  /* istanbul ignore else */
  if (!Factory) {
    throw new Error(`Expecting a valid callable, given '${Factory}'${_suffix}`);
  }

  /* istanbul ignore else */
  if (typeof Factory !== 'function') {
    /* istanbul ignore else */
    if (typeof Factory.call === 'function') {
      return {
        name: Factory.name || 'call',
        call: [Factory, 'call'],
        type: 'method',
      };
    }

    /* istanbul ignore else */
    if (typeof Factory.next === 'function') {
      return {
        name: Factory.name || 'next',
        call: Factory,
        type: 'iterator',
      };
    }

    throw new Error(`'Middleware '${Factory}' should be callable${_suffix}`);
  }

  /* istanbul ignore else */
  if ((Factory.constructor && (Factory.constructor.name === 'GeneratorFunction'))
      || (Factory.prototype && typeof Factory.prototype.next === 'function'
        && typeof Factory.prototype.throw === 'function')) {
    return {
      name: Factory.name || '*',
      call: Factory,
      type: 'generator',
    };
  }

  /* istanbul ignore else */
  if (Factory.prototype && typeof Factory.prototype.call === 'function') {
    return {
      name: Factory.name || '?',
      call: [new Factory(params), 'call'],
      type: 'method',
    };
  }

  /* istanbul ignore else */
  if (Factory.length > 2) {
    return {
      name: Factory.name || '?',
      call: _expressMiddleware(Factory),
      type: 'x-function',
    };
  }

  return {
    name: Factory.name || '?',
    call: Factory,
    type: 'function',
  };
};
