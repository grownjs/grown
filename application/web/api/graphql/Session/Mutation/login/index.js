module.exports = ({ useEffect, API }) => async function login({ req, args }) {
  await useEffect(({ input }) => input(args, 'Session.LoginParams'));

  const { input } = args;

  return API.Session.login({
    guid: req.guid,
    params: {
      email: input.email,
      password: input.password,
    },
  });
};
