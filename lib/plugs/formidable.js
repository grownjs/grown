'use strict';

const debug = require('debug')('grown:upload');

module.exports = defaults => {
  const IncomingForm = require('formidable').IncomingForm;

  defaults = defaults || {};

  return ($, util) => {
    function processForm(conn, opts) {
      debug('Processing uploaded files');

      return new Promise((resolve, reject) => {
        const form = new IncomingForm(util.extend({}, opts, defaults));

        const t = setTimeout(() => {
          debug('Wait. No data received within 1sec');
          reject(new Error('No data received within 1sec, aborting'));
        }, 1000);

        form.parse(conn.req, (err, data, files) => {
          clearTimeout(t);

          if (err) {
            debug('Error. The uploading was errored: %s', err.message);

            reject(err);
          } else {
            debug('Done. The upload was succesfully processed');

            // merge all params, multipart first
            conn.req.body = util.extend({}, data, conn.req.body);

            // expose uploaded files
            conn.req.files = files;

            resolve();
          }
        })
        .on('end', () => clearTimeout(t))
        .on('error', () => clearTimeout(t))
        .on('progress', () => clearTimeout(t));
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
