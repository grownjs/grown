module.exports = () => {
  const e = new Error('ORIGINAL_ERROR');

  e.detail = 'SOME DETAIL INFO';

  throw { original: e }; // eslint-disable-line
};
