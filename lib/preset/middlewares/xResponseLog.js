module.exports = (opts) => {
  return function XResponseTime(conn) {
    const start = process.hrtime();

    conn.before_send(() => {
      const diff = process.hrtime(start);
      const time = (diff[0] * 1e3) + (diff[1] * 1e-6);

      conn.put_resp_header('X-Response-Time', `${time}ms`);

      /* istanbul ignore else */
      if (opts.logger !== false) {
        conn.info(`${conn.method} ${conn.request_path} - Sent ${conn.res.statusCode} in ${time}ms`);
      }
    });
  };
};
