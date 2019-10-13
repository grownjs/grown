const {
  UserNotVerifiedError,
  PasswordMismatchError,
} = require('~/lib/api/errors');

module.exports = ({ Session, User }) => async function verifyAndCreate(email, password) {
  const user = await User.verify(email, password);

  if (!user.verified) {
    throw new UserNotVerifiedError('User is not verified yet');
  }

  const sessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  try {
    const session = await Session.create(sessionData);

    return { user, session };
  } catch (err) {
    throw new PasswordMismatchError(err);
  }
};
