'use strict';

const debug = require('debug')('grown:upload');

module.exports = (Grown, util) => {
  const IncomingForm = require('formidable').IncomingForm;

  function _processForm(conn, opts) {
    debug('#%s Processing uploaded files', conn.pid);

    return new Promise((resolve, reject) => {
      const form = new IncomingForm(opts || {});

      form.parse(conn.req, (err, data, files) => {
        if (err) {
          debug('#%s Error. The upload was errored: %s', conn.pid, err.message);

          reject(err);
        } else {
          debug('#%s Done. The upload was succesfully processed', conn.pid);

          // merge all params, multipart first
          conn.req.body = util.extendValues({}, data, conn.req.body);

          // expose uploaded files
          conn.req.files = files;

          // mark as parsed
          conn.req._body = true;

          resolve();
        }
      });
    });
  }

  return Grown.module('Upload', {
    _processForm,

    mixins() {
      const self = this;

      return {
        props: {
          uploaded_files() {
            return this.req.files || [];
          },
        },
        methods: {
          upload_files(opts) {
            return self._processForm(this, opts || {});
          },
        },
      };
    },
  });
};
