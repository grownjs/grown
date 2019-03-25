const {
  SessionNotFoundError,
} = require('../../../errors');

module.exports = ({ Session }) => async function info({ request }) {
  const { params } = request;

  const query = {
    where: {
      token: params.token,
    },
  };

  const session = await Session.findOne(query);

  if (!session) {
    throw new SessionNotFoundError('Your session does not exists');
  }

  const response = {
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
    token: session.token,
    expirationDate: session.expirationDate.toISOString(),
  };

  return response;
};
