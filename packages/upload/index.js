'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('grown:upload');

module.exports = (Grown, util) => {
  const IncomingForm = require('formidable').IncomingForm;

  function _processForm(conn, opts) {
    debug('#%s Processing uploaded files', conn.pid);

    return new Promise((resolve, reject) => {
      if (conn.req._body) {
        resolve();
        return;
      }

      const form = new IncomingForm({
        uploadDir: path.join(Grown.cwd, 'tmp'),
        keepExtensions: true,
        multiples: true,
        maxFields: 0,
        ...opts,
      });

      if (!fs.existsSync(form.uploadDir)) {
        throw new Error(`Missing directory '${form.uploadDir}'`);
        return;
      }

      form.parse(conn.req, (err, data, files) => {
        if (err) {
          debug('#%s Error. The upload was errored: %s', conn.pid, err.message);

          reject(err);
        } else {
          debug('#%s Done. The upload was succesfully processed', conn.pid);

          // merge all params, multipart first
          conn.req.body = util.extendValues({}, data, conn.req.body);

          // expose uploaded files
          conn.req.files = Object.keys(files).reduce((memo, key) => {
            memo[key] = {
              path: files[key].path,
              name: files[key].name,
              size: files[key].size,
              type: files[key].type,
            };
            return memo;
          }, {});

          // mark as parsed
          conn.req._body = true;

          resolve();
        }
      });
    });
  }

  return Grown('Upload', {
    _processForm,

    $install(ctx) {
      if (this.save_directory) {
        ctx.mount(conn => conn.upload_files({
          maxFileSize: this.max_file_size,
          maxFieldsSize: this.max_field_size,
          uploadDir: this.save_directory,
        }));
      }
    },

    $mixins() {
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
