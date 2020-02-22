module.exports = ({ useAuth, API }) => async function createUser({ req, args }) {
  await useAuth(({ input }) => input.session(req, args, 'User.CreateUserParams'));

  const {
    input: {
      email, password, confirmPassword,
    },
  } = args;

  return API.User.createUser({
    guid: req.guid,
    params: {
      email,
      password,
      confirmPassword,
    },
  });
};
