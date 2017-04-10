module.exports = {
  development: {
    dialect: 'sqlite',
    storage: 'db_{{snakeCase APP_NAME}}.sqlite',
  },
  // development: {
  //   host: 'localhost',
  //   dialect: 'postgres|mysql|mssql',
  //   username: '',
  //   password: '',
  //   database: '{{snakeCase APP_NAME}}_dev',
  // },
};
