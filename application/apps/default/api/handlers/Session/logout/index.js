module.exports = ({ Session }) => async function logout({ request }) {
  const { params } = request;

  await Session.destroy({
    where: {
      token: params.token,
    },
  });

  return {
    success: true,
  };
};
