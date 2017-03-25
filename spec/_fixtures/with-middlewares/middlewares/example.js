module.exports = () => {
  return (conn) => {
    return conn.next(() => {
      if (conn.resp_body) {
        conn.resp_body = `${conn.resp_body}!`;
      }
    });
  };
};
