module.exports = {
  pipeline: {
    err: 'undef',
    test: '_suffix',
  },
  _suffix(conn) {
    return conn.next(() => {
      if (conn.body) {
        conn.body += '!';
      }
    });
  },
  index(conn) {
    conn.body = 'OSOM';
  },
  test(conn) {
    return this.index(conn);
  },
  err() {
  },
};
