'use strict';

module.exports = $ => {
  const MockReq = require('mock-req');

  function makeReq(ctx) {
    const _body = ctx._req && ctx._req.body;
    const _req = ctx._req;

    delete ctx._req;

    const req = new MockReq(_req);

    try {
      if (_body) {
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
          throw new Error(`${req.method} requests does not need body, given ${JSON.stringify(_body)}`);
        }

        if (_body && (Buffer.isBuffer(_body) || typeof _body === 'string')) {
          req.write(_body);
        }

        if (_body && typeof _body.pipe === 'function') {
          _body.pipe(req);
        }
      }
    } catch (e) {
      e.summary = `Invalid request, given '${JSON.stringify(_req)}'`;

      throw e;
    }

    return req;
  }

  return $.module('Test.Mock.Req', {
    // export helpers
    makeReq,

    mixins(ctx) {
      const req = this.makeReq(ctx);

      return {
        props: {
          req: () => req,
        },
      };
    },
  });
};
