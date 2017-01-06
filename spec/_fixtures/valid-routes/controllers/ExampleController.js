module.exports = {
  im_exists($) {
    $.resp_body = 'OSOM';
  },
  test_params($) {
    return this.im_exists($);
  },
};
