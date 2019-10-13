module.exports = ({ useEffect, API }) => async function info({ req }) {
  await useEffect(({ session }) => session(req));

  return API.Session.info({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
