module.exports = {
  browser: [
    'csrf-protection',
    'method-override',
    'body-parsers',
  ],
  development: [
    'browser',
    'no-cache',
  ],
  production: [
    'browser',
  ],
  staging: [
    'browser',
  ],
  http: [],
  ci: [],
};
