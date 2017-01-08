module.exports = (routes) => {
  return routes()
    .get('/no', { to: 'Home.index', middleware: 'invalid' })
    .get('/yes', { to: 'Home.index', middleware: 'test' })
    .get('/err', { to: 'Home.index', middleware: 'err' })
    .get('/maybe', { to: 'Home.err' })
    .get('/surely', { to: 'Home.test' })
    .get('/other-example', { to: 'Other.main' });
};
