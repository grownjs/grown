const {
  PasswordMismatch,
  OldPasswordMismatch,
} = require('~/lib/shared/exceptions');

module.exports = ({ bcrypt, User }) => async function updatePassword(userId, oldPassword, newPassword, confirmPassword) {
  let user;

  try {
    user = await User.verify(null, oldPassword, userId);
  } catch (e) {
    throw new OldPasswordMismatch(e, 'Old password does not match.');
  }

  if (newPassword !== confirmPassword) {
    throw new PasswordMismatch('Wrong password confirmation.');
  }

  const encrypted = await bcrypt.encode(newPassword);

  user.password = encrypted;

  return user.save();
};
