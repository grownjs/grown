module.exports = function (routeMappings) {
  return routeMappings()
    .get('/no', 'Example.not_exists')
    .get('/yes', 'Example.im_exists');
};
