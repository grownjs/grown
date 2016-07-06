module.exports = function (Factory, options) {
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
    throw new Error('Middleware `' + Factory + '` not supported');
  }

  return {
    name: Factory.name || 'anonymous',
    call: Factory,
    type: 'function'
  };
};
