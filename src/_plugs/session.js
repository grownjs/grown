/* eslint-disable global-require */

import { extend, methods } from '../_util';

export default (defaults = {}) => {
  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');

  return ($) => {
    $.ctx.mount(cookieParser(extend({}, defaults)));
    $.ctx.mount(cookieSession(extend({}, defaults)));

    $.ctx.mount((conn) => {
      methods(conn, {
        session: () => extend({}, conn.req.session),

        put_session(name, value) {
          /* istanbul ignore else */
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid put_session: '${name}' => '${value}'`);
          }

          /* istanbul ignore else */
          if (name === '*') {
            throw new Error("Invalid put_session: '*'");
          }

          conn.req.session[name] = value;

          return conn;
        },

        delete_session(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          if (name === '*') {
            conn.req.session = null;
            conn.req.session = {};
          } else {
            conn.req.session[name] = null;
          }

          return conn;
        },

        cookies: () => extend({}, conn.req.signedCookies, conn.req.cookies),
        req_cookies: () => extend({}, conn.req.cookies),
        signed_cookies: () => extend({}, conn.req.signedCookies),

        get_req_cookie(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_cookie: '${name}'`);
          }

          return conn.req.signedCookies[name] || conn.req.cookies[name];
        },

        get_resp_cookie(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          return conn.req.cookies[name];
        },

        put_resp_cookie(name, value, opts = {}) {
          /* istanbul ignore else */
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}' => '${value}'`);
          }

          /* istanbul ignore else */
          if (name === '*') {
            throw new Error("Invalid resp_cookie: '*'");
          }

          conn.res.cookie(name, value, opts);

          return conn;
        },

        merge_resp_cookies(cookies) {
          /* istanbul ignore else */
          if (!(cookies && (typeof cookies === 'object' && !Array.isArray(cookies)))) {
            throw new Error(`Invalid resp_cookies: '${cookies}'`);
          }

          Object.keys(cookies).forEach((key) => {
            conn.put_resp_cookie(key, cookies[key]);
          });

          return conn;
        },

        delete_resp_cookie(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          if (name === '*') {
            Object.keys(conn.res.cookies).forEach((key) => {
              conn.delete_resp_cookie(key);
            });
          } else {
            conn.res.clearCookie(name);
          }

          return conn;
        },
      });
    });
  };
};
