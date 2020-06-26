module.exports = ({ User }) => async function validateToken({ request }) {
  const {
    params: {
      email, token,
    },
  } = request;

  await User.validateToken(email, token);

  return {
    success: true,
  };
};
