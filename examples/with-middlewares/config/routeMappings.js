module.exports = function (routeMappings) {
  return routeMappings()
    .get('/no', { to: 'Home.index', middleware: 'invalid' })
    .get('/yes', { to: 'Home.index', middleware: 'example' })
    .get('/maybe', { to: 'Home.err' })
    .get('/surely', { to: 'Home.test' });
};
