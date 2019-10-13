module.exports = ({ User }) => async function updatePassword({ request }) {
  const {
    params: {
      userId, oldPassword, newPassword, confirmPassword,
    },
  } = request;

  const user = await User.updatePassword(userId, oldPassword, newPassword, confirmPassword);

  return user.getRaw();
};
