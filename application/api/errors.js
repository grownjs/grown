const { buildError } = require('berro');

const UserErrors = {
  UserNotFoundError: buildError('User.NOT_FOUND', 5, 404),
  UserNotVerifiedError: buildError('User.NOT_VERIFIED', 7, 403),
  PasswordMismatchError: buildError('User.PASSWORD_MISMATCH', 9, 400),
  OldPasswordMismatchError: buildError('User.OLD_PASSWORD_MISMATCH', 9, 400),
};

const SessionErrors = {
  SessionNotFoundError: buildError('Session.NOT_FOUND', 5, 404),
  TokenExpiredError: buildError('Session.TOKEN_EXPIRED', 8, 401),
};

module.exports = {
  ...UserErrors,
  ...SessionErrors,
};
