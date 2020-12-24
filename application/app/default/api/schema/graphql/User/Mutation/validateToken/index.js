module.exports = ({ useAuth, API }) => async function validateToken({ req, args }) {
  await useAuth(({ input }) => input.session(req, args, 'User.ValidateTokenParams'));

  const {
    input: {
      email, token,
    },
  } = args;

  return API.User.validateToken({
    guid: req.guid,
    params: {
      email,
      token,
    },
  });
};
