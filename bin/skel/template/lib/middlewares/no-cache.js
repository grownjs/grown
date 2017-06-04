'use strict';

module.exports = () => {
  return function noCache($) {
    $.put_resp_header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    $.put_resp_header('Expires', '-1');
    $.put_resp_header('Pragma', 'no-cache');
  };
};
