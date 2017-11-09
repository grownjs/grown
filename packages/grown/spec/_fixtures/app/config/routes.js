module.exports = map =>
  map()
    .get('/', 'Home')
    .resources('/Example');
