export default () => {
  return (conn) => {
    conn.put_resp_header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    conn.put_resp_header('Expires', '-1');
    conn.put_resp_header('Pragma', 'no-cache');
  };
};
