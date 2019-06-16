const log = require('logro').createLogger(__filename);

const CleanUpSeeds = require('./cleanup');
const UserSeeds = require('./user');

const Application = require('../../lib');

const { connect, sequelize } = Application.Models
  ._getDB(Application.Models.connection.identifier);

async function integrationSeeds(tasks) {
  try {
    await tasks.reduce((prev, { run }) => {
      return prev.then(() => run.call(Application, sequelize));
    }, Promise.resolve());
  } catch (err) {
    log.exception(err, 'E_FATAL');
    process.exit(1);
  }
}

async function runTasks() {
  if (process.argv.slice(2).includes('--clear')) {
    return CleanUpSeeds.run.call(Application, sequelize);
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
