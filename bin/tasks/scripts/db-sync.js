module.exports = function db($, argv, logger) {
  const _tasks = [];

  if (argv._.length) {
    argv._.forEach(name => {
      if (!$.extensions.models[name]) {
        throw new Error(`Undefined model: ${name}`);
      }

      logger.log(`Syncing ${name} model...`);

      _tasks.push($.extensions.models[name].sync({ force: argv.flags.true }));
    });
  } else {
    logger.log('Syncing all models...');

    _tasks.push($.extensions.models.sync({ force: argv.flags.force }));
  }

  return Promise.all(_tasks);
};
