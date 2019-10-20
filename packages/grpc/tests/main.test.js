/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const path = require('path');

const Grown = require('grown')();

Grown.use(require('..'));

let gateway;

function mockGateway(protobuf, controllers, overrideOptions) {
  const Gateway = Grown.GRPC.Gateway({
    include: [
      Grown.GRPC.Loader.scan(protobuf),
    ],
  });

  return Gateway.setup(controllers, { timeout: 1, ...overrideOptions }).start();
}

/* global beforeEach, afterEach, describe, it */

describe('Grown.GRPC', () => {
  const validHandlers = {
    get: () => ({
      is: ({ request }) => ({ reveal: request.truth === 42 }),
      ok: () => new Promise(next => setTimeout(() => next({ ok: null }), 1050)),
      err: () => Promise.reject(new Error('FAILURE')),
      throw: () => { throw new Error('FAILURE'); },
    }),
  };

  const validProtobuf = path.join(__dirname, 'fixtures/index.proto');

  afterEach(() => {
    if (gateway) gateway.stop();
  });

  describe('Loader', () => {
    it('should validate its input', () => {
      expect(() => Grown.GRPC.Loader.scan()).to.throw(/Unable to load protobuf/);
      expect(() => Grown.GRPC.Loader.scan(path.join(__dirname, 'fixtures/other.proto'))).to.throw(/API package not found/);
      expect(() => Grown.GRPC.Loader.scan(path.join(__dirname, 'fixtures/invalid.proto'))).to.throw(/Cannot convert undefined/);
    });

    it('should scan/load properly', () => {
      gateway = mockGateway(validProtobuf, validHandlers);

      return gateway.API.Test.is({ truth: 42 })
        .then(result => {
          expect(result).to.eql({ reveal: 'true' });
        });
    });

    it('should validate given namespace', () => {
      expect(() => mockGateway(validProtobuf, validHandlers, { namespace: 'undef' })).to.throw(/Service.*not found/);
    });

    it('should allow custom hostnames', () => {
      mockGateway(validProtobuf, validHandlers, { hostname: () => null }).stop();
    });
  });

  describe('Gateway', () => {
    beforeEach(() => {
      gateway = mockGateway(validProtobuf, validHandlers);
    });

    it('should validate its input', () => {
      return Promise.resolve()
        .then(() => gateway.sendTest().catch(e => expect(e).to.match(/Invalid method for/)))
        .then(() => gateway.sendTest('is').catch(e => expect(e).to.match(/Missing data for/)))
        .then(() => Grown.GRPC.Gateway.setup()).catch(e => expect(e).to.match(/Service.*not found/)); // eslint-disable-line
    });

    it('should handle container failures', () => {
      expect(() => mockGateway(validProtobuf, {
        get: () => {
          const err = new Error('EXCEPTION');

          err.stack = null;

          throw err;
        },
      })).to.throw(/Failed at loading.*EXCEPTION/);
    });

    it('should handle controller failures (promise)', () => {
      let err;

      return gateway.API.Test.err().catch(e => { err = e; })
        .then(() => expect(err.original.message).to.eql('FAILURE'));
    });

    it('should handle controller failures (throw)', () => {
      let err;

      return gateway.API.Test.throw().catch(e => { err = e; })
        .then(() => expect(err.original.message).to.eql('FAILURE'));
    });

    it('should handle timeout errors', () => {
      let err;

      return gateway.API.Test.ok().catch(e => { err = e; })
        .then(() => {
          expect(err).not.to.be.undefined;
          expect(err).to.match(/Deadline Exceeded/);
        });
    });
  });
});
