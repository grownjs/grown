module.exports = ({ useAuth, API }) => async function resetPassword({ req, args }) {
  await useAuth(({ input }) => input(req, args, 'User.ResetPasswordParams'));

  const {
    input: {
      token, newPassword, confirmPassword,
    },
  } = args;

  return API.User.resetPassword({
    guid: req.guid,
    params: {
      token,
      newPassword,
      confirmPassword,
    },
  });
};
