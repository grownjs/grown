const {
  SessionNotFound,
} = require('~/lib/shared');

module.exports = ({ Session }) => async function info({ request }) {
  const { params } = request;

  const query = {
    where: {
      token: params.token,
    },
    include: [
      Session.associations.user,
    ],
  };

  const session = await Session.findOne(query);

  if (!session) {
    throw new SessionNotFound('Your session does not exists.');
  }

  return {
    user: {
      id: session.userId,
      role: session.role,
      email: session.email,
      platform: session.user.platform,
    },
    token: session.token,
    expirationDate: session.expirationDate,
  };
};
