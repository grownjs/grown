module.exports = function (Factory, options) {
  if (Factory.dispatch) {
    return {
      name: Factory.name || 'object',
      call: [Factory, 'dispatch']
    };
  } else if (Factory.prototype && Factory.prototype.dispatch) {
    return {
      name: Factory.name || 'class',
      call: [new Factory(options), 'dispatch']
    };
  }

  if (typeof Factory !== 'function') {
    throw new Error('Middleware `' + Factory + '` should be a function');
  }

  if (Factory.length === 4 || Factory.length === 3) {
    throw new Error('Middleware `' + Factory + '` not supported');
  }

  return {
    name: Factory.name || 'anonymous',
    call: Factory
  };
};
