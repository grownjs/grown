module.exports = ({ useEffect, API }) => async function recoverPassword({ req, args }) {
  await useEffect(({ input }) => input(req, args, 'User.RecoverPasswordParams'));

  const { input: { email } } = args;

  return API.User.recoverPassword({
    guid: req.guid,
    params: {
      email,
    },
  });
};
