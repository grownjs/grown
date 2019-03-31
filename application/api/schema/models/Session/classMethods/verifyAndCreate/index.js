const {
  UserNotVerifiedError,
  PasswordMismatchError,
} = require('~/api/errors');

module.exports = ({ Session, User }) => async function verifyAndCreate(email, password) {
  const response = {};

  const user = await User.verify(email, password);

  if (!user.verified) {
    throw new UserNotVerifiedError();
  }

  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  response.user = user;

  try {
    const session = await Session.create(sessionData);

    response.session = session;

    return response;
  } catch (err) {
    throw new PasswordMismatchError(err);
  }
};
