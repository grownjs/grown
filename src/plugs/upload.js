/* eslint-disable global-require */

module.exports = (defaults = {}) => {
  const IncomingForm = require('formidable').IncomingForm;

  return ($, { extend, methods }) => {
    function processForm(conn, opts) {
      return new Promise((resolve, reject) => {
        const form = new IncomingForm(extend({}, opts, defaults));

        form.parse(conn.req, (err, data, files) => {
          if (err) {
            reject(err);
          } else {
            // merge all params, multipart first
            conn.req.body = extend({}, data, conn.req.body);

            resolve(files);
          }
        });
      });
    }

    $.ctx.mount('upload', (conn) => {
      methods(conn, {
        upload_files(opts = {}) {
          return (conn.type && conn.type.indexOf('multipart') === -1) || processForm(conn, opts);
        },
      });
    });
  };
};
