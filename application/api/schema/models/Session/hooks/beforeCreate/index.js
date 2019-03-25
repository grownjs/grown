const randToken = require('rand-token');

module.exports = async function beforeCreate(instance) {
  instance.expirationDate = await instance.defineExpiration(instance.role);
  instance.token = randToken.generate(16);
  return instance;
};
