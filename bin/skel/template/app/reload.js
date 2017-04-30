const server = require('./server');

module.exports = $ => {
  const farm = server();

  farm.listen(process.env.PORT || 8080)
    .then(app => {
      $.logger.printf(`\r\rListening at ${app.location.href}`);
    })
    .catch(error => {
      $.logger.printf(`\r\r${error.stack}`);
    });

  return () => {
    $.logger.printf('\r\rReloading server...');

    return server.teardown();
  };
};

