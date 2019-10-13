module.exports = ({ useEffect, API }) => async function resetPassword({ req, args }) {
  await useEffect(({ input }) => input(req, args, 'User.ResetPasswordParams'));

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
