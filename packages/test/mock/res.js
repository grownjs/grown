'use strict';

module.exports = $ => {
  const MockRes = require('mock-res');

  return $.module('Test.Mock.Res', {
    mixins() {
      const res = new MockRes();

      res.cookies = {};
      res.clearCookie = k => { delete res.cookies[k]; };
      res.cookie = (k, v, o) => { res.cookies[k] = { value: v, opts: o || {} }; };

      const _setHeader = res.setHeader;

      res.setHeader = (k, v) => {
        if (k === 'set-cookie') {
          v.forEach(x => {
            const parts = x.split(';')[0].split('=');

            res.cookies[parts[0]] = parts[1];
          });
        }

        _setHeader.call(res, k, v);
      };

      Object.defineProperty(res, 'body', {
        get: () => res._getString(),
      });

      Object.defineProperty(res, 'json', {
        get: () => {
          try {
            return res._getJSON();
          } catch (e) {
            return null;
          }
        },
      });

      return {
        props: {
          res: () => res,
        },
      };
    },
  });
};
