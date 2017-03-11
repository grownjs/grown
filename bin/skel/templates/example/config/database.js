module.exports = {
  {{#db.sqlite}}dev: {
    dialect: 'sqlite',
    storage: './db.dev.sqlite',
  },{{/db.sqlite}}{{#db.postgres}}dev: {
    host: 'localhost',
    dialect: 'postgres',
    username: 'postgres',
    password: '',
    database: '{{snakeCase appName}}_dev',
  },{{/db.postgres}}{{#db.mysql}}dev: {
    host: 'localhost',
    dialect: 'mysql',
    username: 'root',
    password: '',
    database: '{{snakeCase appName}}_dev',
  },{{/db.mysql}}{{#db.mssql}}dev: {
    host: 'localhost',
    dialect: 'mssql',
    username: 'root',
    password: '',
    database: '{{snakeCase appName}}_dev',
  },{{/db.mssql}}
};
