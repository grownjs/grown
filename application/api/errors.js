const {
  buildError,
  IS_NOT_FOUND,
  IS_PERMISSION_DENIED,
  IS_RESOURCE_EXHAUSTED,
  IS_FAILED_PRECONDITION,
} = require('berro');

const UserErrors = {
  UserNotFoundError: buildError('User.NOT_FOUND', IS_NOT_FOUND, 404),
  UserNotVerifiedError: buildError('User.NOT_VERIFIED', IS_PERMISSION_DENIED, 403),
  PasswordMismatchError: buildError('User.PASSWORD_MISMATCH', IS_FAILED_PRECONDITION, 400),
  OldPasswordMismatchError: buildError('User.OLD_PASSWORD_MISMATCH', IS_FAILED_PRECONDITION, 400),
};

const SessionErrors = {
  SessionNotFoundError: buildError('Session.NOT_FOUND', IS_NOT_FOUND, 404),
  TokenExpiredError: buildError('Session.TOKEN_EXPIRED', IS_RESOURCE_EXHAUSTED, 401),
};

module.exports = {
  ...UserErrors,
  ...SessionErrors,
};
