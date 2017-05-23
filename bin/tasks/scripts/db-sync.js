module.exports = ($, argv, logger) =>
  Promise.all((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name].sync({
      force: argv.flags.true,
    }).then(() => {
      logger.log(`— ${name} was synced`);
    });
  }));
