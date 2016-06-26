var qs = require('qs');

module.exports = function (conn) {
  return new Promise(function (resolve) {
    if (conn.path.length > 1 && conn.req.headers['content-type'] || conn.req.headers['transfer-encoding']) {
      conn.body = '';

      var _type = conn.req.headers['content-type'] ? conn.req.headers['content-type'].toString() : '';
      var _multipart = _type.indexOf('multipart/form-data');

      if (_multipart === -1) {
        conn.req.on('data', function (data) {
          conn.body += data;
        });

        conn.req.on('end', function () {
          if (_type === 'application/json') {
            try {
              conn.body = JSON.parse(conn.body);
            } catch (error) {
              // TODO: proper handling?
            }
          } else if (_type.indexOf('application/x-www-form-urlencoded') > -1) {
            conn.body = qs.parse(conn.body);
          }

          conn.multipart = false;
          resolve();
        });
      } else {
        conn.multipart = true;
        resolve();
      }
    } else {
      resolve();
    }
  });
};
