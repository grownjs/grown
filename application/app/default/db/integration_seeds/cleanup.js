module.exports = {
  async run(sequelize) {
    await sequelize.query('DELETE FROM "sessions"');
    await sequelize.query('DELETE FROM "users"');
  },
};
