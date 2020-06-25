/* istanbul ignore */

const isDocker = process.cwd() === '/app';

const env = process.env.NODE_ENV || 'development';
const database = process.env.DB_NAME || 'user_dev';
const username = process.env.POSTGRES_USER || 'postgres';
const logging = env === 'test' || process.env.REMOVE_LOG === 'YES' ? false : require('logro').logger; // eslint-ignore

const config = module.exports = {
  env,
  logging,
  timeout: 1000,
  directory: __dirname,
  seederStorage: 'sequelize',
  migrations: {
    database: true,
  },
};

if (['test', 'development'].includes(env)) {
  config.storage = `${__dirname}/db.sqlite`;
  config.dialect = 'sqlite';
} else {
  config.database = database;
  config.username = username;
  config.password = process.env.POSTGRES_PASSWORD || '*secret*';
  config.host = process.env.DB_HOST || (isDocker ? 'db' : 'localhost');
  config.port = process.env.DB_PORT || 5432;
  config.dialect = 'postgres';
}

if (['staging', 'production'].includes(env)) {
  config.ssl = true;
  config.dialectOptions = {
    ssl: {
      required: true,
    },
  };
}
