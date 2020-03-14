const {
  PasswordMismatch,
} = require('~/api/errors');

module.exports = ({ User, Token, mailer }) => async function createUser({ request }) {
  const {
    guid,
    params: {
      email, password, confirmPassword,
    },
  } = request;

  if (password !== confirmPassword) {
    throw new PasswordMismatch('Wrong password confirmation.');
  }

  // FIXME: send mail to very before first login!
  const role = 'GUEST';
  const user = await User.create({ role, email, password });
  const token = await Token.buildNew(user.id, 'VALIDATE_EMAIL');

  await mailer.emailConfirmation({
    data: {
      token: token.token,
      email: user.email,
    },
    email: user.email,
    subject: 'Please confirm your address',
  }, guid);

  return {
    success: true,
  };
};
