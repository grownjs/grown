module.exports = {
  $schema: require('./schema.json'),
  $attributes: {
    findAll: ['token', 'email', 'expirationDate', 'role', 'user', 'userId'],
  },
};
