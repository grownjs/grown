const Therror = require('therror');

class UserNotFound extends Therror.HTTP(404) {}
class UserNotVerified extends Therror.HTTP(403) {}

class PasswordMismatch extends Therror.HTTP(400) {}
class OldPasswordMismatch extends Therror.HTTP(400) {}
class ResetPasswordExpired extends Therror.HTTP(401) {}

class TokenExpired extends Therror.HTTP(401) {}
class SessionNotFound extends Therror.HTTP(401) {}
class SessionExpired extends Therror.HTTP(401) {}

module.exports = {
  UserNotFound,
  UserNotVerified,
  PasswordMismatch,
  OldPasswordMismatch,
  ResetPasswordExpired,
  TokenExpired,
  SessionNotFound,
  SessionExpired,
};
