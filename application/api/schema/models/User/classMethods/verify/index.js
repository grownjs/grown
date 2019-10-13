const {
  UserNotFoundError,
} = require('~/api/errors');

module.exports = ({ bcrypt, User }) => async function verify(email, password, userId) {
  const query = {
    where: {
      email,
    },
  };

  if (!email && userId) {
    query.where = {
      id: userId,
    };
  }

  const user = await User.findOne(query);
  const result = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!(user && result)) {
    throw new UserNotFoundError('Your input is invalid');
  }

  return user;
};
