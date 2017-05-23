'use strict';

const debug = require('debug')('grown:upload');

module.exports = defaults => {
  const IncomingForm = require('formidable').IncomingForm;

  defaults = defaults || {};

  return $ => {
    function processForm(conn, opts) {
      debug('#%s Processing uploaded files', conn.pid);

      return new Promise((resolve, reject) => {
        const form = new IncomingForm($.util.extend({}, opts, defaults));

        form.parse(conn.req, (err, data, files) => {
          if (err) {
            debug('#%s Error. The uploading was errored: %s', conn.pid, err.message);

            reject(err);
          } else {
            debug('#%s Done. The upload was succesfully processed', conn.pid);

            // merge all params, multipart first
            conn.req.body = $.util.extend({}, data, conn.req.body);

            // expose uploaded files
            conn.req.files = files;

            resolve();
          }
        });
      });
    }

    $.extensions('Conn', {
      props: {
        uploaded_files() {
          return this.req.files || [];
        },
      },
      methods: {
        upload_files(opts) {
          return processForm(this, opts || {});
        },
      },
    });
  };
};
