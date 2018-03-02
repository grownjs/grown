'use strict';

const qs = require('querystring');
const url = require('url');
const typeIs = require('type-is');
const accepts = require('accepts');

module.exports = (Grown, util) => {
  function _fixURL(location) {
    const _uri = url.parse(location);

    let _query = '';

    /* istanbul ignore else */
    if (_uri.query) {
      _query = qs.stringify(qs.parse(_uri.query));
    }

    return [
      _uri.protocol ? `${_uri.protocol}//` : '',
      _uri.hostname ? _uri.hostname : '',
      _uri.port ? `:${_uri.port}` : '',
      _uri.pathname ? _uri.pathname : '',
      _query ? `?${_query}` : '',
    ].join('');
  }

  return Grown('Conn.Request', {
    _fixURL,

    $mixins() {
      function _accepts(req) {
        if (!_accepts.fn) {
          _accepts.fn = accepts(req);
        }

        return _accepts.fn;
      }

      function _is(req, types) {
        if (!_is.fn) {
          _is.fn = typeIs(req);
        }

        return _is.fn(types);
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

          has_type() {
            return _is(this.req, Array.prototype.slice.call(arguments));
          },

          // current connection
          host() {
            return (this.req.headers.host && this.req.headers.host.split(':')[0]) || process.env.HOST || '0.0.0.0';
          },

          port() {
            return (this.req.headers.host && this.req.headers.host.split(':')[1]) || process.env.PORT || '8080';
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
            return this.req.url.split('?')[1] || '';
          },

          query_params() {
            return qs.parse(this.req.url.split('?')[1] || '');
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
