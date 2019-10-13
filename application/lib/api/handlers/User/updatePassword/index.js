module.exports = ({ User }) => async function updatePassword({ request }) {
  const {
    params: {
      userId, oldPassword, newPassword, confirmPassword,
    },
  } = request;

  await User.updatePassword(userId, oldPassword, newPassword, confirmPassword);

  return {
    success: true,
  };
};
