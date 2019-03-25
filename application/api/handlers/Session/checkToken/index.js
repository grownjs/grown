module.exports = ({ Session }) => async function checkToken({ request }) {
  const { params } = request;

  const session = await Session.checkToken(params.token);

  const response = {
    token: session.token,
    expirationDate: session.expirationDate.toISOString(),
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
  };

  return response;
};
