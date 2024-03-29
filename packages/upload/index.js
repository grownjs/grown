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
        try {
          fs.mkdirSync(form.uploadDir, { recursive: true });
        } catch (e) {
          throw new Error(`Failed to create directory '${form.uploadDir}'`);
        }
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
              name: files[key].name || files[key].originalFilename,
              path: files[key].path || files[key].filepath,
              type: files[key].type || files[key].mimetype,
              size: files[key].size,
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

    $install(ctx, scope) {
      if (this.save_directory) {
        scope._uploads = true;
        ctx.mount(conn => this._processForm(conn, {
          maxFileSize: this.max_file_size,
          maxFieldsSize: this.max_field_size,
          uploadDir: this.save_directory,
        }));
      }
    },

    $mixins() {
      return {
        props: {
          uploaded_files() {
            return this.req.files || {};
          },
        },
      };
    },
  });
};
