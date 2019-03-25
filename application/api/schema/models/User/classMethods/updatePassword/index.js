const {
  PasswordMismatchError,
  OldPasswordMismatchError,
} = require('../../../../../errors');

module.exports = ({ User, bcrypt }) => async function updatePassword(userId, oldPassword, newPassword, confirmPassword) {
  let user;

  try {
    user = await User.verify(null, oldPassword, userId);
  } catch (e) {
    throw new OldPasswordMismatchError(e);
  }

  if (newPassword !== confirmPassword) {
    throw new PasswordMismatchError('Your input is not valid');
  }

  const encrypted = await bcrypt.encode(newPassword);

  user.password = encrypted;

  return user.save();
};
