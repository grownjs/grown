module.exports = {
  pipeline: {
    err: 'undef',
    test: '_suffix'
  },
  _suffix: function (conn) {
    return conn.next(function () {
      if (conn.body) {
        conn.body += '!';
      }
    });
  },
  index: function (conn) {
    conn.body = 'OSOM';
  },
  test: function (conn) {
    return this.index(conn);
  },
  err: function () {
  }
};
