const {
  SessionNotFound,
} = require('~/lib/errors');

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
      name: session.user.name,
      picture: session.user.picture,
      platform: session.user.platform,
    },
    token: session.token,
    expirationDate: session.expirationDate,
  };
};
