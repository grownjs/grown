module.exports = {
  async run() {
    const User = this.Models.get('User');
    const userData = require('../integration_fixtures/users');

    await Promise.all(userData.map(user => User.create(user)));
  },
};
