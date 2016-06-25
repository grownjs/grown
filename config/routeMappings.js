module.exports = function (routeMappings) {
  return routeMappings()
    .get('/', { to: 'Home.index', middleware: ['sample'] });
};
