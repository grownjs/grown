module.exports = ({ User }) => async function resetPassword({ request }) {
  const {
    params: {
      token, newPassword, confirmPassword,
    },
  } = request;

  await User.resetPassword(token, newPassword, confirmPassword);

  return {
    success: true,
  };
};
