module.exports = (routeMappings) => {
  return routeMappings()
    .get('/no', { to: 'Home.index', middleware: 'invalid' })
    .get('/yes', { to: 'Home.index', middleware: 'test' })
    .get('/err', { to: 'Home.index', middleware: 'err' })
    .get('/maybe', { to: 'Home.err' })
    .get('/surely', { to: 'Home.test' });
};
