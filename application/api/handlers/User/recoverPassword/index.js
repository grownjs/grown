module.exports = ({ mailer, User, Token }) => async function recoverPassword({ request }) {
  const {
    guid,
    params: {
      email,
    },
  } = request;

  const user = await User.getUser(null, email);
  const token = await Token.buildNew(user.id, 'RECOVER_PASSWORD');

  await mailer.recoverPassword({
    data: {
      token: token.token,
      email: user.email,
      name: user.firstName,
    },
    email: user.email,
    subject: 'Password recovery request',
  }, guid);

  return {
    success: true,
  };
};
