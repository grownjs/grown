'use strict';

module.exports = (Grown, util) => {
  const Auth = require('./auth')(Grown, util);

  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');
  const connectFlash = require('connect-flash');

  const defaultOptions = {
    secret: process.env.SESSION_SECRET || '__CHANGE_ME__',
    keys: (process.env.SESSION_KEYS || '__CHANGE_ME__').split(/\s+/),
    maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
  };

  return Grown('Session', {
    session_options: {
      ...defaultOptions,
    },

    $before_send(e, ctx) {
      /* istanbul ignore else */
      if (ctx.is_xhr && ctx.csrf_token) {
        if (typeof ctx.end === 'function') {
          ctx.put_resp_header('X-CSRF-Token', ctx.csrf_token);
        } else {
          ctx.res.setHeader('X-CSRF-Token', ctx.csrf_token);
        }
      }
    },

    $install(ctx) {
      /* istanbul ignore else */
      if (this.parse_cookies !== false) {
        ctx.mount('cookie-parser', cookieParser(this.session_secret || this.session_options.secret, this.cookie_options || {}));
      }

      /* istanbul ignore else */
      if (this.session_cookies !== false) {
        ctx.mount('cookie-session', cookieSession({ ...defaultOptions, ...this.session_options }));
      }

      /* istanbul ignore else */
      if (typeof this.session_store === 'function') {
        ctx.mount('session-store', this.session_store());
      }

      /* istanbul ignore else */
      if (this.session_messages !== false) {
        ctx.mount('connect-flash', connectFlash());
      }
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

          get_flash(type) {
            const msgs = this.req.flash && this.req.flash(type);

            if (Array.isArray(msgs)) {
              return msgs.map(value => ({ type, value }));
            }

            return Object.keys(msgs).reduce((memo, key) => {
              memo.push(...msgs[key].map(value => ({ type: key, value })));
              return memo;
            }, []);
          },

          put_session(name, value) {
            /* istanbul ignore else */
            if (typeof name === 'object') {
              Object.keys(name).forEach(key => {
                this.put_session(key, name[key]);
              });
              return this;
            }

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
            if (Array.isArray(name)) {
              name.forEach(key => {
                if (key) this.delete_session(key);
              });
              return this;
            }

            /* istanbul ignore else */
            if (!(name && typeof name === 'string')) {
              throw new Error(`Invalid resp_cookie: '${name}'`);
            }

            if (name === '*') {
              this.req.session = null;
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
            if (!(name && typeof name === 'string' && typeof value === 'string')) {
              throw new Error(`Invalid resp_cookie: '${name}' => '${value}'`);
            }

            /* istanbul ignore else */
            if (name === '*') {
              throw new Error("Invalid resp_cookie: '*'");
            }

            opts = opts ? `;${Object.keys(opts).map(k => `${k}=${opts[k]}`).join(';')}` : '';
            this.req.cookies[name] = `${name}=$value${opts}`;

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
              this.put_resp_cookie(name, '', { path: '/', expires: new Date(1) });
            }

            return this;
          },
        },
      };
    },
    include: [
      Auth,
    ],
  });
};
