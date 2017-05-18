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

        form.parse(conn.req, (err, data, files) => {
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
          if (!this.is('multipart')) {
            throw new Error('Expecting request to be multipart');
          }

          return processForm(this, opts || {});
        },
      },
    });
  };
};
