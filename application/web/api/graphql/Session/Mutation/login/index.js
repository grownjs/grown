module.exports = ({ useEffect, API }) => async function login({ req, args }) {
  await useEffect(({ input }) => input(req, args, 'Session.LoginParams'));

  return API.Session.login({
    guid: req.guid,
    params: {
      email: args.input.email,
      password: args.input.password,
    },
  });
};
