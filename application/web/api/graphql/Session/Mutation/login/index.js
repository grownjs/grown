module.exports = ({ useEffect, API }) => async function login({ req, args }) {
  await useEffect(({ validate }) => {
    console.log(validate);
    // auth.input(req, args, "User.UpdatePasswordParams")
  });

  const { input } = args;

  return API.Session.login({
    guid: req.guid,
    params: {
      email: input.email,
      password: input.password,
    },
  });
};
