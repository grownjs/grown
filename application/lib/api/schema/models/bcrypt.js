const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function encode(value, saltRounds) {
  const salt = await bcrypt.genSalt(saltRounds || SALT_ROUNDS);
  const hash = await bcrypt.hash(value, salt);

  return hash;
}

async function compare(value, encoded) {
  const result = await bcrypt.compare(value, encoded);

  return result;
}

module.exports = {
  encode,
  compare,
};
