module.exports = (conn) => {
  return conn.next(() => {
    if (conn.body) {
      conn.body += '!';
    }
  });
};
