const {
  PasswordMismatchError,
  OldPasswordMismatchError,
} = require('~/api/errors');

module.exports = ({ bcrypt, User }) => async function updatePassword(userId, oldPassword, newPassword, confirmPassword) {
  let user;

  try {
    user = await User.verify(null, oldPassword, userId);
  } catch (e) {
    throw new OldPasswordMismatchError(e);
  }

  if (newPassword !== confirmPassword) {
    throw new PasswordMismatchError('Wrong password confirmation');
  }

  const encrypted = await bcrypt.encode(newPassword);

  user.password = encrypted;

  return user.save();
};
