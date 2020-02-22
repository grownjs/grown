module.exports = ({ User }) => async function createUser({ request }) {
  const {
    params: {
      email, password, confirmPassword,
    },
  } = request;

  if (password !== confirmPassword) {
    throw new Error('FIXME!');
  }

  // FIXME: send mail to very before first login!

  const role = 'GUEST';

  await User.create({ role, email, password });

  return {
    success: true,
  };
};
