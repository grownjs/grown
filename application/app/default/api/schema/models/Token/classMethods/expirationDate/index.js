// FIXME: user/src/api/models/Session/instanceMethods/defineExpiration/index.js?
module.exports = function expirationDate() {
  const date = new Date();

  // default to 15 min
  date.setTime(date.getTime() + (6000 * 150));

  return date;
};
