module.exports = routes => {
  return routes()
    .get('/no', 'Example.not_exists')
    .get('/yes', 'Example.im_exists')
    .get('/:value', 'Example.test_params')
    .get('/broken/handler', 'Broken.ctrl');
};
