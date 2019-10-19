/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const path = require('path');

const Grown = require('grown')();

Grown.use(require('..'));

let gateway;

function mockGateway(protobuf, controllers) {
  const Gateway = Grown.GRPC.Gateway({
    include: [
      Grown.GRPC.Loader.scan(protobuf),
    ],
  });

  return Gateway.setup(Grown.load(controllers)).start();
}

/* global beforeEach, afterEach, describe, it */

describe('Grown.GRPC', () => {
  const validHandlers = path.join(__dirname, 'fixtures/handlers');
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
  });

  describe('Gateway', () => {
    beforeEach(() => {
      gateway = mockGateway(validProtobuf, validHandlers);
    });

    it('....', () => {
      // FIXME
    });
  });
});
