'use strict';

module.exports = ($, util) => {
  const MockReq = require('mock-req');

  function makeReq(options) {
    const _body = options.body;

    delete options.body;

    const req = new MockReq(options);

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
      e.summary = `Invalid request, given '${util.inspect(options)}'`;

      throw e;
    }

    return req;
  }

  return $.module('Test.Mock.Req', {
    // export helpers
    makeReq,

    mixins(options) {
      const req = this.makeReq(options);

      return {
        props: {
          req: () => req,
        },
      };
    },
  });
};
