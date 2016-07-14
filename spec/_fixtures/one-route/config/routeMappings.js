module.exports = function (routeMappings) {
  return routeMappings()
    .get('/', 'Home.index');
};
