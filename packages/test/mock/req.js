'use strict';

module.exports = $ => {
  const MockReq = require('mock-req');

  return $.module('Test.Mock.Req', {
    mixins() {
      const _body = this._req && this._req.body;
      const _req = this._req;

      delete this._req;

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

      return {
        props: {
          req: () => req,
        },
      };
    },
  });
};
