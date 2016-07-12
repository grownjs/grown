function _expressMiddleware(callback) {
  return function (conn) {
    if (callback.length === 4) {
      return conn.next().catch(function (error) {
        return new Promise(function (resolve, reject) {
          callback(error, conn.req, conn.res, function (_error) {
            if (_error) {
              reject(_error);
            } else {
              resolve();
            }
          });
        });
      });
    }

    return new Promise(function (resolve, reject) {
      callback(conn.req, conn.res, function (error) {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
}

module.exports = function (Factory, options) {
  if (!Factory) {
    throw new Error('Expecting a valid callable, given `' + Factory + '`');
  }

  /* istanbul ignore else */
  if (typeof Factory !== 'function') {
    /* istanbul ignore else */
    if (typeof Factory.call === 'function') {
      return {
        name: Factory.name || 'anonymous',
        call: [Factory, 'call'],
        type: 'method'
      };
    }

    /* istanbul ignore else */
    if (typeof Factory.next === 'function') {
      return {
        name: Factory.name || 'anonymous',
        call: Factory,
        type: 'iterator'
      };
    }

    throw new Error('Middleware `' + Factory + '` should be callable');
  }

  /* istanbul ignore else */
  if ((Factory.constructor && (Factory.constructor.name === 'GeneratorFunction'))
      || (Factory.prototype && typeof Factory.prototype.next === 'function' && typeof Factory.prototype.throw === 'function')) {
    return {
      name: Factory.name || 'anonymous',
      call: Factory,
      type: 'generator'
    };
  }

  /* istanbul ignore else */
  if (Factory.prototype && typeof Factory.prototype.call === 'function') {
    return {
      name: Factory.name || 'anonymous',
      call: [new Factory(options), 'call'],
      type: 'method'
    };
  }

  /* istanbul ignore else */
  if (Factory.length > 2) {
    return {
      name: Factory.name || 'anonymous',
      call: _expressMiddleware(Factory),
      type: 'function'
    };
  }

  return {
    name: Factory.name || 'anonymous',
    call: Factory,
    type: 'function'
  };
};
