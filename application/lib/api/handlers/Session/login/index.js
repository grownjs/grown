module.exports = ({ Session }) => async function login({ request }) {
  const { params: { email, password } } = request;
  const { user, session } = await Session.verifyAndCreate(email, password);

  const response = {
    user: user.getRaw(),
    token: session.token,
    expirationDate: session.expirationDate.toISOString(),
  };

  return response;
};
