module.exports = {
  im_exists: function (conn) {
    conn.body = 'OSOM';
  },
  test_params: function (conn) {
    return this.im_exists(conn);
  }
};
