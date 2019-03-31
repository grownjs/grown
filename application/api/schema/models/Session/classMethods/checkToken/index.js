const {
  TokenExpiredError,
} = require('~/api/errors');

module.exports = ({ Session }) => async function checkToken(token) {
  const session = await Session.findOne({
    where: {
      token,
    },
  });

  if (!session || (new Date() >= session.expirationDate)) {
    throw new TokenExpiredError('Your session does not exists');
  }

  session.expirationDate = await session.defineExpiration(session.role);

  await session.save();

  return session;
};
