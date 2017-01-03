module.exports = {
  im_exists(conn) {
    conn.resp_body = 'OSOM';
  },
  test_params(conn) {
    return this.im_exists(conn);
  },
};
