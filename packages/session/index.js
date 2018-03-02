'use strict';

module.exports = (Grown, util) => {
  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');
  const connectFlash = require('connect-flash');

  return Grown('Session', {
    session_options: {
      secret: process.env.SESSION_SECRET || '__CHANGE_ME__',
      keys: (process.env.SESSION_KEYS || '__CHANGE_ME__').split(/\s+/),
      maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
    },

    $install(ctx) {
      ctx.mount('cookie-parser', cookieParser(this.session_secret, this.cookie_options || {}));
      ctx.mount('cookie-session', cookieSession(this.session_options));
      ctx.mount('connect-flash', connectFlash());

      ctx.mount('Session#pipe', conn => {
        /* istanbul ignore else */
        if (conn.is_json || conn.req.method !== 'GET') {
          return;
        }

        conn.state.flash_messages = conn.req.flash();
        conn.state.csrf_token = conn.csrf_token;

        /* istanbul ignore else */
        if (conn.is_xhr) {
          conn.set_resp_header('X-CSRF-Token', conn.csrf_token);
        }
      });
    },

    $mixins() {
      return {
        props: {
          csrf_token() {
            return this.req.csrfToken && this.req.csrfToken();
          },

          session() {
            return util.extendValues({}, this.req.session);
          },

          cookies() {
            return util.extendValues({}, this.req.signedCookies, this.req.cookies);
          },

          req_cookies() {
            return util.extendValues({}, this.req.cookies);
          },

          signed_cookies() {
            return util.extendValues({}, this.req.signedCookies);
          },
        },
        methods: {
          put_flash(type, message) {
            this.req.flash(type, message);

            return this;
          },

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
      };
    },
  });
};
