module.exports = {
  dev: {
    dialect: 'sqlite',
    storage: 'db_{{snakeCase APP_NAME}}.sqlite',
  },
  // dev: {
  //   host: 'localhost',
  //   dialect: 'postgres|mysql|mssql',
  //   username: '',
  //   password: '',
  //   database: '{{snakeCase APP_NAME}}_dev',
  // },
};
