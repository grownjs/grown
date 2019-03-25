module.exports = ({ use, API }) => async function recoverPassword({ req, args }) {
  // await use(({ input }) => input(req, args, 'User.RecoverPasswordParams'));

  const { input: { email } } = args;

  return API.User.recoverPassword({
    guid: req.guid,
    params: {
      email,
    },
  });
};
