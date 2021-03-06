'use strict';

const fs = require('fs');

module.exports = Grown => {
  const MockRes = require('mock-res');

  function _mockResponse() {
    const res = new MockRes();

    res._header = null;
    res.locals = {};
    res.cookies = {};
    res.clearCookie = k => { delete res.cookies[k]; };
    res.cookie = (k, v, o) => { res.cookies[k] = { value: v, opts: o || {} }; };

    const _setHeader = res.setHeader;

    res.setHeader = (k, v) => {
      res._header = true;

      if (k === 'set-cookie') {
        v.forEach(x => {
          const parts = x.split(';')[0].split('=');

          res.cookies[parts[0]] = parts[1];
        });
      }

      _setHeader.call(res, k, v);
    };

    res.sendFile = (src, meta) => {
      res.writeHead(200, (meta || {}).headers);
      res.write(fs.readFileSync(src));
      res.end();
    };

    res.status = n => {
      res.statusCode = n;
      return res;
    };

    res.send = out => {
      if (typeof out !== 'undefined') {
        res.write(typeof out !== 'string' ? JSON.stringify(out) : out);
      }
      res.end();
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

    function assert(actual, expected, description) {
      let pass;

      if (typeof actual === 'string' && typeof expected === 'string') {
        pass = actual.includes(expected);
      } else if (expected instanceof RegExp) {
        pass = expected.test(actual);
      } else if (actual === expected) {
        pass = true;
      }

      if (!pass) {
        throw new Error(`Response failure:\n${description}\n- actual: ${actual}\n- expected: ${expected}`);
      }
    }

    Object.defineProperty(res, 'ok', {
      value: (err, body = '', status = 200, message = '') => {
        if (typeof body === 'number') {
          status = body;
          message = '';
          body = '';
        }

        if (message) assert(res.statusMessage, message, 'Invalid status message');

        assert(res.statusCode, status, 'Invalid status code');
        assert(res.body, body, 'Body is invalid');
        assert(err, null, 'Unexpected failure');
      },
    });

    return res;
  }

  return Grown('Test.Mock.Res', {
    // export helpers
    _mockResponse,

    $mixins() {
      const res = this._mockResponse();

      return {
        props: {
          res: () => res,
        },
      };
    },
  });
};
