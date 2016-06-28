module.exports = function (Factory, options) {
  if (Factory.dispatch) {
    return {
      name: Factory.name || 'object',
      call: [Factory, 'dispatch']
    };
  } else if (Factory.prototype.dispatch) {
    return {
      name: Factory.name || 'class',
      call: [new Factory(options), 'dispatch']
    };
  }

  if (Factory.length === 4 || Factory.length === 3) {
    throw new Error('Middleware `' + Factory + '` not supported');
  }

  return {
    name: Factory.name || 'anonymous',
    call: Factory
  };
};
