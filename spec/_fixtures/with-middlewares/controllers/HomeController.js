module.exports = {
  pipeline: {
    err: 'undef',
    test: '_suffix',
  },
  _suffix(conn) {
    return conn.next(() => {
      if (conn.resp_body) {
        conn.resp_body = `${conn.resp_body}!`;
      }
    });
  },
  index(conn) {
    conn.resp_body = 'OSOM';
  },
  test(conn) {
    return this.index(conn);
  },
  err() {
  },
};
