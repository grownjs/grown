'use strict';

function _callOrReject(fn, check) {
  return new Promise((next, failure) => {
    let called;

    Promise.resolve()
      .then(() => fn(e => {
        called = true;

        if (e) {
          failure(e);
        } else {
          next();
        }
      }))
      .then(() => process.nextTick(() => check && check(called) && next()));
  });
}

function _expressMiddleware(cb) {
  return conn => {
    /* istanbul ignore else */
    if (cb.length === 4) {
      return conn.next().catch(error => _callOrReject(_done => cb(error, conn.req, conn.res, _done)));
    }

    return _callOrReject(_done => cb(conn.req, conn.res, _done), isCalled => !isCalled && conn.res._halted);
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
