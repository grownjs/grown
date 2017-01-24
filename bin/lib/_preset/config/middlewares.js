module.exports = {
  dev: [
    'stage',
    'test',
  ],
  test: [
    'no-cache',
  ],
  prod: [
    'stage',
  ],
  stage: [
    'csurf',
  ],
};
