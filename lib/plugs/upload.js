'use strict';

/* eslint-disable global-require */

const debug = require('debug')('homegrown:upload');

module.exports = function $upload(defaults) {
  const IncomingForm = require('formidable').IncomingForm;

  defaults = defaults || {};

  return ($, util) => {
    function processForm(conn, opts) {
      debug('Processing upload files', opts);

      return new Promise((resolve, reject) => {
        const form = new IncomingForm(util.extend({}, opts, defaults));

        form.parse(conn.req, (err, data, files) => {
          if (err) {
            debug('Wait. The upload form was errored');

            reject(err);
          } else {
            debug('Done. The upload form was succesfully processed');

            // merge all params, multipart first
            conn.req.body = util.extend({}, data, conn.req.body);

            // expose uploaded files
            conn.req.files = files;

            resolve();
          }
        });
      });
    }

    $.extensions('Homegrown.conn', {
      props: {
        uploaded_files() {
          return this.req.files || [];
        },
      },
      methods: {
        upload_files(opts) {
          return this.is('multipart') && processForm(this, opts || {});
        },
      },
    });
  };
};
