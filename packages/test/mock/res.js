'use strict';

module.exports = $ => {
  const MockRes = require('mock-res');

  return $.module('Test.Mock.Res', {
    install(ctx) {
      ctx.mount('res', conn => {
        conn.res = new MockRes();
        conn.res.cookies = {};
        conn.res.clearCookie = k => { delete conn.res.cookies[k]; };
        conn.res.cookie = (k, v, o) => { conn.res.cookies[k] = { value: v, opts: o || {} }; };

        const _setHeader = conn.res.setHeader;

        conn.res.setHeader = (k, v) => {
          if (k === 'set-cookie') {
            v.forEach(x => {
              const parts = x.split(';')[0].split('=');

              conn.res.cookies[parts[0]] = parts[1];
            });
          }

          _setHeader.call(conn.res, k, v);
        };

        Object.defineProperty(conn.res, 'body', {
          get: () => conn.res._getString(),
        });

        Object.defineProperty(conn.res, 'json', {
          get: () => {
            try {
              return conn.res._getJSON();
            } catch (e) {
              return null;
            }
          },
        });
      });
    },
  });
};
