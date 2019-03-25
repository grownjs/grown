module.exports = ({ use, API }) => async function logout({ req }) {
  await use(({ session }) => session(req));

  return API.Session.logout({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
