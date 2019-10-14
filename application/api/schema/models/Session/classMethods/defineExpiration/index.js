const TIME = {
  ADMIN: 45,
  GUEST: 15,
  USER: 30,
};

function expirationTime(time) {
  const today = new Date();

  today.setMinutes(today.getMinutes() + time);

  return today;
}

module.exports = function defineExpiration(role) {
  return expirationTime(TIME[role]);
};

