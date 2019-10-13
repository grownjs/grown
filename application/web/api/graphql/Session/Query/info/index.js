module.exports = ({ useEffect, API }) => async function info({ req, args }) {
  await useEffect(({ input }) => input.session(req, args, 'Session.TokenParams'));

  return API.Session.info({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
