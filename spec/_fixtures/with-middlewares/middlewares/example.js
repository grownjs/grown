module.exports = function (conn) {
  return conn.next(function () {
    if (conn.body) {
      conn.body += '!';
    }
  });
};
