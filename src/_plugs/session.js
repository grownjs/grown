/* eslint-disable global-require */

import { extend, methods } from '../_util';

export default (defaults = {}) => {
  const cookieSession = require('cookie-session');
  const cookieParser = require('cookie-parser');

  return ($) => {
    $.ctx.mount(cookieParser(defaults));
    $.ctx.mount(cookieSession(defaults));

    $.ctx.mount((conn) => {
      methods(conn, {
        session: () => extend({}, conn.req.session),

        put_session(name, value) {
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid put_session: '${name}' => '${value}'`);
          }

          conn.req.session[name] = value;

          return $;
        },

        clear_session() {
          conn.req.session = {};

          return $;
        },

        delete_session() {
          conn.req.session = null;

          return $;
        },

        cookies: () => extend({}, conn.req.signedCookies, conn.req.cookies),
        req_cookies: () => extend({}, conn.req.cookies),
        signed_cookies: () => extend({}, conn.req.signedCookies),

        get_req_cookie(name) {
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_cookie: '${name}'`);
          }

          return conn.req.signedCookies[name] || conn.req.cookies[name];
        },

        get_resp_cookie(name) {
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          return conn.req.cookies[name];
        },

        put_resp_cookie(name, value, opts = {}) {
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}' => '${value}'`);
          }

          conn.res.cookie(name, value, opts);

          return $;
        },

        merge_resp_cookies(cookies) {
          if (!(cookies && (typeof cookies === 'object' && !Array.isArray(cookies)))) {
            throw new Error(`Invalid resp_cookies: '${cookies}'`);
          }

          Object.keys(cookies).forEach((key) => {
            conn.put_resp_cookie(key, cookies[key]);
          });

          return $;
        },

        delete_resp_cookie(name) {
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_cookie: '${name}'`);
          }

          delete conn.req.cookies[name];

          return $;
        },
      });
    });
  };
};
