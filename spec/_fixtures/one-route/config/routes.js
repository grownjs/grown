module.exports = (routes) => {
  return routes()
    .get('/', 'Home.index');
};
