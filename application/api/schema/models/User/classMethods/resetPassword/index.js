const {
  PasswordMismatchError,
} = require('~/api/errors');

module.exports = ({ bcrypt, User, Token }) => async function setPassword(token, newPassword, confirmPassword) {
  const { userId } = await Token.verify(token, 'RECOVER_PASSWORD');

  if (newPassword !== confirmPassword) {
    throw new PasswordMismatchError('Wrong password confirmation');
  }

  const encrypted = await bcrypt.encode(newPassword);

  await Token.clear(userId, 'RECOVER_PASSWORD');

  return User.update({
    password: encrypted,
  }, {
    where: {
      id: userId,
    },
  });
};
