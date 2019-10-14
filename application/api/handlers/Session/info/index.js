const {
  SessionNotFoundError,
} = require('~/api/errors');

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
    throw new SessionNotFoundError('Your session does not exists');
  }

  return {
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
      platform: session.user.platform,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
    },
    token: session.token,
    expirationDate: session.expirationDate.toISOString(),
  };
};
