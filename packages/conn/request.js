'use strict';

const qs = require('qs');
const typeIs = require('type-is');
const accepts = require('accepts');

module.exports = (Grown, util) => {
  return Grown('Conn.Request', {
    $mixins() {
      function _accepts(req) {
        /* istanbul ignore else */
        if (!_accepts.fn) {
          _accepts.fn = accepts(req);
        }

        return _accepts.fn;
      }

      return {
        props: {
          req_headers() {
            return this.req.headers;
          },

          // ajax
          is_xhr() {
            return this.req.headers['x-requested-with'] === 'XMLHttpRequest';
          },

          is_json() {
            return typeIs.is(this.req.headers['content-type'], ['json']) === 'json';
          },

          // current connection
          host() {
            return (this.req.headers.host && this.req.headers.host.split(':')[0]) || process.env.HOST || '0.0.0.0';
          },

          port() {
            return (this.req.headers.host && this.req.headers.host.split(':')[1]) || process.env.PORT || '80';
          },

          remote_ip() {
            // FIXME:
            return '0.0.0.0';
          },

          method() {
            return this.req.method;
          },

          params() {
            return util.extendValues({}, this.path_params, this.query_params, this.body_params);
          },

          path_info() {
            return this.req.url.split('?')[0].split('/').filter(x => x);
          },

          path_params() {
            return util.extendValues({}, this.req.params || {});
          },

          body_params() {
            return util.extendValues({}, this.req.body || {});
          },

          request_path() {
            return this.req.url.split('?')[0];
          },

          query_string() {
            return qs.stringify(this.req.query).replace(/=$/, '');
          },

          query_params() {
            return this.req.query || {};
          },

          accept_charset(charsets) {
            return _accepts(this.req).charset(charsets);
          },
          accept_charsets() {
            return _accepts(this.req).charsets();
          },

          accept_encoding(encodings) {
            return _accepts(this.req).encoding(encodings);
          },
          accept_encodings() {
            return _accepts(this.req).encodings();
          },

          accept_language(languages) {
            return _accepts(this.req).language(languages);
          },
          accept_languages() {
            return _accepts(this.req).languages();
          },

          accept_type(types) {
            return _accepts(this.req).type(types);
          },
          accept_types() {
            return _accepts(this.req).types();
          },
        },
        methods: {
          has_type() {
            return typeIs(this.req, Array.prototype.slice.call(arguments));
          },

          get_req_header(name, defvalue) {
            /* istanbul ignore else */
            if (!(name && typeof name === 'string')) {
              throw new Error(`Invalid req_header: '${name}'`);
            }

            /* istanbul ignore else */
            if (typeof this.req.headers[name] === 'undefined') {
              return defvalue;
            }

            return this.req.headers[name];
          },

          put_req_header(name, value) {
            /* istanbul ignore else */
            if (!name || typeof name !== 'string') {
              throw new Error(`Invalid req_header: '${name}' => '${value}'`);
            }

            this.req.headers[name] = value;

            return this;
          },

          delete_req_header(name) {
            /* istanbul ignore else */
            if (!(name && typeof name === 'string')) {
              throw new Error(`Invalid req_header: '${name}'`);
            }

            delete this.req.headers[name];

            return this;
          },
        },
      };
    },
  });
};
