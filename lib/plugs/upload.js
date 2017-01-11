'use strict';

/* eslint-disable global-require */

module.exports = (defaults) => {
  const IncomingForm = require('formidable').IncomingForm;

  defaults = defaults || {};

  return ($, util) => {
    function processForm(conn, opts) {
      return new Promise((resolve, reject) => {
        const form = new IncomingForm(util.extend({}, opts, defaults));

        form.parse(conn.req, (err, data, files) => {
          if (err) {
            reject(err);
          } else {
            // merge all params, multipart first
            conn.req.body = util.extend({}, data, conn.req.body);

            // expose uploaded files
            conn.req.files = files;

            resolve();
          }
        });
      });
    }

    $.ctx.mount('upload', (conn) => {
      util.methods(conn, {
        uploaded_files: () => conn.req.files || [],
        upload_files(opts) {
          return conn.is('multipart') && processForm(conn, opts || {});
        },
      });
    });
  };
};
