module.exports = {
  async run() {
    const User = this.Services.getModel('User');
    const userData = require('../integration_fixtures/users');

    await Promise.all(userData.map(user => User.create(user)));
  },
};
