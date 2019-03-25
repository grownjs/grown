module.exports = ({ use, API }) => async function updatePassword({ req, args }) {
  // await use(({ auth }) => auth.input(req, args, 'User.UpdatePasswordParams'));
  await use(({ session }) => session(req));

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
