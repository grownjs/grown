module.exports = {
  ci: [
    'no-cache',
  ],
  dev: [
    'stage',
    'ci',
  ],
  prod: [
    'stage',
  ],
  stage: [
    'csurf',
  ],
};
