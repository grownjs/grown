module.exports = ({ useEffect, API }) => async function updatePassword({ req, args }) {
  // await useEffect(({ auth }) => auth.input(req, args, 'User.UpdatePasswordParams'));
  await useEffect(({ session }) => session(req));

  const { input: { oldPassword, newPassword, confirmPassword } } = args;

  return API.User.updatePassword({
    guid: req.guid,
    params: {
      userId: req.user.id,
      oldPassword,
      newPassword,
      confirmPassword,
    },
  });
};
