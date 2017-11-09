'use strict';

module.exports = $ => {
  const MockReq = require('mock-req');

  return $.module('Test.Mock.Req', {
    install(ctx) {
      ctx.mount(conn => {
        const _body = conn.req && conn.req.body;

        if (conn.req) {
          delete conn.req.body;
        }

        conn.req = new MockReq(conn.req);

        if (_body) {
          return new Promise((resolve, reject) =>
            process.nextTick(() => {
              try {
                if (_body && (Buffer.isBuffer(_body) || typeof _body === 'string')) {
                  conn.req.write(_body);
                  conn.req.end();
                }

                if (_body && typeof _body.pipe === 'function') {
                  _body.pipe(conn.req);
                }

                resolve();
              } catch (e) {
                reject(e);
              }
            }));
        }
      });
    },
  });
};
