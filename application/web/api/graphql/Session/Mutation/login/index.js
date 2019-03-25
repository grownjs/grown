module.exports = ({ API }) => function login({ req, args }) {
  const { input } = args;

  return API.Session.login({
    guid: req.guid,
    params: {
      email: input.email,
      password: input.password,
    },
  });
};
