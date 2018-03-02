'use strict';

module.exports = (Grown, util) => {
  const MockReq = require('mock-req');

  function _mockRequest(options) {
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

  return Grown('Test.Mock.Req', {
    // export helpers
    _mockRequest,

    $mixins(options) {
      const req = this._mockRequest(options);

      return {
        props: {
          req: () => req,
        },
      };
    },
  });
};
