module.exports = () => {
  throw { errors: [new Error('SINGLE_ERROR')] }; // eslint-disable-line
};
