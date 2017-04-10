module.exports = {
  ci: [
    'no-cache',
  ],
  development: [
    'staging',
    'ci',
  ],
  production: [
    'staging',
  ],
  staging: [
    'csurf',
  ],
};
