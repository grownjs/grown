module.exports = {
  methods: {
    index(conn) {
      conn.resp_body = '<h1>It works!</h1>';
    },
  },
};
