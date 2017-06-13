'use strict';

module.exports = defaults => {
  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');

  defaults = defaults || {};

  return $ => {
    $.on('listen', () => {
      $.mount('cookie-parser', cookieParser(defaults.secret, defaults.cookieParse || {}));
      $.mount('cookie-session', cookieSession($.util.extend({}, defaults)));
    });

    $.extensions('Conn', {
      props: {
        session() {
          return $.util.extend({}, this.req.session);
        },

        cookies() {
          return $.util.extend({}, this.req.signedCookies, this.req.cookies);
        },

        req_cookies() {
          return $.util.extend({}, this.req.cookies);
        },

        signed_cookies() {
          return $.util.extend({}, this.req.signedCookies);
        },
      },
      methods: {
        put_session(name, value) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid put_session: '${name}' => '${value}'`);
          }

          /* istanbul ignore else */
          if (name === '*') {
            throw new Error("Invalid put_session: '*'");
          }

          this.req.session[name] = value;

          return this;
        },

        delete_session(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          if (name === '*') {
            this.req.session = {};
          } else {
            delete this.req.session[name];
          }

          return this;
        },

        get_req_cookie(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_cookie: '${name}'`);
          }

          return this.req.signedCookies[name] || this.req.cookies[name];
        },

        get_resp_cookie(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          return this.req.cookies[name];
        },

        put_resp_cookie(name, value, opts) {
          /* istanbul ignore else */
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}' => '${value}'`);
          }

          /* istanbul ignore else */
          if (name === '*') {
            throw new Error("Invalid resp_cookie: '*'");
          }

          this.res.cookie(name, value, opts || {});

          return this;
        },

        merge_resp_cookies(cookies) {
          /* istanbul ignore else */
          if (!(cookies && (typeof cookies === 'object' && !Array.isArray(cookies)))) {
            throw new Error(`Invalid resp_cookies: '${cookies}'`);
          }

          Object.keys(cookies).forEach(key => {
            this.put_resp_cookie(key, cookies[key]);
          });

          return this;
        },

        delete_resp_cookie(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          if (name === '*') {
            Object.keys(this.res.cookies).forEach(key => {
              this.delete_resp_cookie(key);
            });
          } else {
            this.res.clearCookie(name);
          }

          return this;
        },
      },
    });
  };
};
