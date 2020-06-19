const passport = require('passport');
const FacebookStrategy = require('passport-facebook');

module.exports = ({ options, credentials }, req, cb) => {
  credentials = typeof credentials === 'function' ? credentials(req) : credentials;
  credentials.profileFields = credentials.profileFields || ['id', 'displayName', 'email'];

  passport.use(new FacebookStrategy(credentials, ($1, $2, profile, done) =>
    Promise.resolve().then(() => cb('facebook', profile._json)).then(userInfo => done(null, userInfo))));

  options = options || {};
  options.session = false;
  options.scope = options.scope || ['email'];

  return passport.authenticate('facebook', options);
};
