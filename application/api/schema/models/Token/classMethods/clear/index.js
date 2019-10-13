module.exports = ({ Token }) => async function clear(user, type) {
  const query = {
    where: {
      type,
      userId: user.id,
    },
  };

  return Token.destroy(query);
};
