module.exports = ({ Session }) => async function login({ request }) {
  const { params: { email, password } } = request;
  const { user, session } = await Session.verifyAndCreate(email, password);

  return {
    user: user.getRaw(),
    token: session.token,
    expirationDate: session.expirationDate.toISOString(),
  };
};
