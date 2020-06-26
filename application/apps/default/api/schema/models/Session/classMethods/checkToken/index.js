const {
  SessionExpired,
} = require('~/lib/shared');

module.exports = ({ Session }) => async function checkToken(token) {
  const session = await Session.findOne({
    where: {
      token,
    },
  });

  if (!session || (new Date() >= session.expirationDate)) {
    throw new SessionExpired('Session has been expired.');
  }

  session.expirationDate = Session.defineExpiration(session.role);

  await session.save();

  return session;
};
