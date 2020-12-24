module.exports = ({ useAuth, API }) => async function logout({ req }) {
  await useAuth(({ session }) => session(req));

  return API.Session.logout({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
