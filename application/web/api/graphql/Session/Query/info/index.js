module.exports = ({ use, API }) => async function info({ req }) {
  await use(({ session }) => session(req));

  return API.Session.info({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
