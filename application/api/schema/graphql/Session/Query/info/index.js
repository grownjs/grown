module.exports = ({ useAuth, API }) => async function info({ req, args }) {
  await useAuth(({ input }) => input.session(req, args, 'Session.TokenParams'));

  return API.Session.info({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
