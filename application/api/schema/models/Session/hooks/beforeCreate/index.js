const randToken = require('rand-token');

module.exports = ({ Session }) => async function beforeCreate(instance) {
  instance.expirationDate = Session.defineExpiration(instance.role);
  instance.token = randToken.generate(16);
  return instance;
};
