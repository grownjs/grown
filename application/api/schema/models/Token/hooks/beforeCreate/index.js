// FIXME: move things like this to util?
const randtoken = require('rand-token');

module.exports = ({ Token }) => async function beforeCreate(instance) {
  instance.token = randtoken.generate(16);
  instance.expirationDate = Token.expirationDate(instance.type);
};
