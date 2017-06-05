module.exports = map =>
  map()
    .get('/', 'Home.index')
    .resources('/Example');
