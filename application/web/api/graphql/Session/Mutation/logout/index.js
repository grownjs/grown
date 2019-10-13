module.exports = ({ useEffect, API }) => async function logout({ req }) {
  await useEffect(({ session }) => session(req));

  return API.Session.logout({
    guid: req.guid,
    params: {
      token: req.token,
    },
  });
};
