module.exports = routes => {
  return routes()
    .get('/no', { to: 'Home.index', use: 'invalid' })
    .get('/yes', { to: 'Home.index', use: 'test' })
    .get('/err', { to: 'Home.index', use: 'err' })
    .get('/maybe', { to: 'Home.err' })
    .get('/surely', { to: 'Home.test' })
    .get('/other-example', { to: 'Other.main' });
};
