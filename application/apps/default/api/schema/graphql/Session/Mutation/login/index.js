module.exports = ({ useAuth, API }) => async function login({ req, args }) {
  await useAuth(({ input }) => input(req, args, 'Session.LoginParams'));

  return API.Session.login({
    guid: req.guid,
    params: {
      email: args.input.email,
      password: args.input.password,
    },
  });
};
