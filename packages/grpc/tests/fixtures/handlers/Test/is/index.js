module.exports = function is({ request }) {
  return { reveal: request.truth === 42 };
};
