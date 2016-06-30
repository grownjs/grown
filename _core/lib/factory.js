module.exports = function (Factory, options) {
  if (Factory.dispatch) {
    return {
      name: Factory.name || 'anonymous',
      call: [Factory, 'dispatch'],
      type: 'object'
    };
  }

  if (Factory.prototype && typeof Factory.prototype.dispatch === 'function') {
    return {
      name: Factory.name || 'anonymous',
      call: [new Factory(options), 'dispatch'],
      type: 'method'
    };
  }

  if (typeof Factory !== 'function') {
    if (typeof Factory.call === 'function') {
      Factory.name = Factory.name || 'anonymous';
      Factory.type = Factory.type || 'factory';

      return Factory;
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

  if (typeof Factory.prototype.next === 'function') {
    return {
      name: Factory.name || 'anonymous',
      call: Factory,
      type: 'generator'
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
