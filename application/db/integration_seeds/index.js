const log = require('logro').createLogger(__filename);

const CleanUpSeeds = require('./cleanup');
const UserSeeds = require('./user');

const App = require('../../lib');

const { connect, sequelize } = App.Models
  ._getDB(App.Models.connection.identifier);

async function integrationSeeds(tasks) {
  try {
    await tasks.reduce((prev, { run }) => {
      return prev.then(() => run.call(App, sequelize));
    }, Promise.resolve());
  } catch (err) {
    log.exception(err, 'E_FATAL');
    process.exit(1);
  }
}

async function runTasks() {
  if (process.argv.slice(2).includes('--clear')) {
    return CleanUpSeeds.run.call(App, sequelize);
  }

  await integrationSeeds([
    CleanUpSeeds,
    UserSeeds,
  ]);
}

Promise.resolve()
  .then(() => connect())
  .then(() => runTasks())
  .then(() => sequelize.close())
  .then(() => {
    console.log('Done.');
    process.exit();
  });
