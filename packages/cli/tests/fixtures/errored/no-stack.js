module.exports = () => {
  const e = new Error('NO_STACK');

  e.stack = undefined;

  throw e;
};
