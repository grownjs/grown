module.exports = ({ Token }) => async function buildNew(user, type) {
  const userData = user || {};

  const data = {
    userId: userData.id,
    type,
  };

  await Token.clear(userData, type);

  return Token.create(data);
};
