module.exports = (routeMappings) => {
  return routeMappings()
    .get('/', 'Home.index');
};
