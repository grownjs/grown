'use strict';

const fs = require('fs');
const qs = require('qs');
const url = require('url');
const path = require('path');
const http = require('http');
const https = require('https');
const typeIs = require('type-is');
const accepts = require('accepts');

module.exports = (Grown, util) => {
  function _fetchBody(_url, filePath) {
    const options = typeof filePath === 'object' ? filePath : null;

    /* istanbul ignore else */
    if (options !== null && typeof options !== 'undefined') {
      filePath = null;
    }

    return new Promise((resolve, reject) => {
      let dest;
      let file;
      let req = new url.URL(_url);

      const reqInfo = {
        hostname: req.host.replace(/:\d+$/, ''),
        port: req.port || (req.protocol === 'https:' ? 443 : 80),
        path: req.pathname + req.search,
        method: req.method || 'GET',
        ...options,
      };

      const query = reqInfo.query;
      delete reqInfo.query;

      if (query) {
        reqInfo.path += reqInfo.path.includes('?') ? '&' : '?';
        reqInfo.path += new URLSearchParams(query).toString();
      }

      const body = reqInfo.body;
      delete reqInfo.body;

      req = (_url.indexOf('https:') !== -1 ? https : http)
        .request(reqInfo, async response => {
          /* istanbul ignore else */
          if (response.statusCode >= 300 && response.statusCode < 400) {
            response = await this._fetchBody(url.resolve(_url, response.headers.location));
          }

          if (filePath) {
            dest = path.resolve(filePath);
            file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => file.close(() => resolve(dest)));
          } else resolve(response);
        }).on('error', err => {
          if (dest) fs.unlinkSync(dest);
          reject(err);
        });

      /* istanbul ignore else */
      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  return Grown('Conn.Request', {
    _fetchBody,
    $mixins() {
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
            return (this.req.connection && this.req.connection.remoteAddress) || '0.0.0.0';
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

          accept_charsets() {
            return this.accept.charsets();
          },
          accept_encodings() {
            return this.accept.encodings();
          },
          accept_languages() {
            return this.accept.languages();
          },
          accept_types() {
            return this.accept.types();
          },
          accept() {
            /* istanbul ignore else */
            if (!this.req._ok) {
              this.req._ok = accepts(this.req);
            }

            return this.req._ok;
          },
        },
        methods: {
          has_type(...args) {
            return typeIs(this.req, ...args);
          },

          accept_charset(charsets) {
            return this.accepts.charset(charsets);
          },
          accept_encoding(encodings) {
            return this.accepts.encoding(encodings);
          },
          accept_language(languages) {
            return this.accepts.language(languages);
          },
          accept_type(types) {
            return this.accepts.type(types);
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

          get_buffer(_url, options) {
            return this.get_file(_url, options)
              .then(stream => new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks)));
              }));
          },

          get_json(_url, options, encoding) {
            return this.get_body(_url, options, encoding).then(result => {
              try {
                return JSON.parse(result);
              } catch (e) {
                return { error: e.message, result };
              }
            });
          },

          get_body(_url, options, encoding) {
            if (typeof options === 'string') {
              encoding = options;
              options = null;
            }
            return this.get_buffer(_url, options).then(obj => obj.toString(encoding || 'utf8'));
          },

          get_file(_url, filePath) {
            return self._fetchBody(_url, filePath);
          },
        },
      };
    },
  });
};
