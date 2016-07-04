module.exports = function (Factory, options) {
  if (typeof Factory !== 'function') {
    if (typeof Factory.call === 'function') {
      return {
        name: Factory.name || 'anonymous',
        call: [Factory, 'call'],
        type: 'method'
      };
    }

    if (typeof Factory.next === 'function') {
      return {
        name: Factory.name || 'anonymous',
        call: Factory,
        type: 'iterator'
      };
    }

    throw new Error('Middleware `' + Factory + '` should be callable');
  }

  if ((Factory.constructor && (Factory.constructor.name === 'GeneratorFunction'))
      || typeof Factory.prototype.next === 'function' || typeof Factory.prototype.throw === 'function') {
    return {
      name: Factory.name || 'anonymous',
      call: Factory,
      type: 'generator'
    };
  }

  if (typeof Factory.prototype.call === 'function') {
    return {
      name: Factory.name || 'anonymous',
      call: [new Factory(options), 'call'],
      type: 'method'
    };
  }

  if (Factory.length > 2) {
    throw new Error('Middleware `' + Factory + '` not supported');
  }

  return {
    name: Factory.name || 'anonymous',
    call: Factory,
    type: 'function'
  };
};
