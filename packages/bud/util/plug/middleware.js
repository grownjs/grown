'use strict';

function _callOrReject(fn, ...args) {
  return Promise.resolve().then(() => fn(...args, error => {
    /* istanbul ignore else */
    if (error) throw error;
  }));
}

function _expressMiddleware(callback) {
  return conn => {
    /* istanbul ignore else */
    if (callback.length === 4) {
      return conn.next().catch(error => _callOrReject(callback, error, conn.req, conn.res));
    }

    return _callOrReject(callback, conn.req, conn.res);
  };
}

module.exports = (Factory, _name) => {
  const _suffix = _name ? ` (${_name})` : '';

  /* istanbul ignore else */
  if (!Factory || Array.isArray(Factory)) {
    throw new Error(`Expecting a valid callable, given '${JSON.stringify(Factory)}'${_suffix}`);
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
  if (Factory.init || Factory.extensions
    || (Factory.prototype && Object.keys(Factory.prototype).length)) {
    return {
      name: Factory.name || '#',
      call: [new Factory(), 'call'],
      type: 'method',
    };
  }

  /* istanbul ignore else */
  if (Factory.length > 2) {
    return {
      name: Factory.name || '!',
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
