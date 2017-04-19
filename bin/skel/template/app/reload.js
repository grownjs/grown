const server = require('./server');

const Module = require('module');

module.exports = $ => {
  const farm = server();

  farm.listen(process.env.PORT || 8080)
    .then((app) => {
      $.logger.printf(`\r\rListening at ${app.location.href}`);
    })
    .catch((error) => {
      $.logger.printf(`\r\r${error.stack}`);
    });

  return () => {
    $.logger.printf('\r\rReloading server...');

    Object.keys(Module._cache)
      .forEach((key) => {
        if (key.indexOf('node_modules') === -1) {
          delete Module._cache[key];
        }
      });

    return server.teardown();
  };
};

