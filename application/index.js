const Grown = require('@grown/bud')();

Grown.use(require('@grown/server'));

module.exports = () => {
  const server = new Grown();

  return server;
};
