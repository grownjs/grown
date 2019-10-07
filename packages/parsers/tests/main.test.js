/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('grown')();

Grown.use(require('@grown/test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('Grown.Parsers', () => {
  let server;

  beforeEach(() => {
    server = new Grown();
    server.mount(conn => conn.req.end());
    server.plug(Grown.Test);
  });

  it('should handle URLENCODED', () => {
    server.plug(Grown.Parsers.URLENCODED);

    return server.request('/', 'POST', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'foo=bar',
    }, (err, conn) => {
      expect(err).to.be.null;
      expect(conn.req.body).to.eql({ foo: 'bar' });
    });
  });

  it('should handle JSON', () => {
    server.plug(Grown.Parsers.JSON);

    return server.request('/', 'POST', {
      headers: {
        'content-type': 'application/json',
      },
      body: '{"foo":"bar"}',
    }, (err, conn) => {
      expect(err).to.be.null;
      expect(conn.req.body).to.eql({ foo: 'bar' });
    });
  });

  it('should handle TEXT', () => {
    server.plug(Grown.Parsers.TEXT);

    return server.request('/', 'POST', {
      headers: {
        'content-type': 'text/plain',
      },
      body: 'foo bar',
    }, (err, conn) => {
      expect(err).to.be.null;
      expect(conn.req.body).to.eql('foo bar');
    });
  });

  it('should handle RAW', () => {
    server.plug(Grown.Parsers.RAW);

    return server.request('/', 'POST', {
      headers: {
        'content-type': 'application/octet-stream',
      },
      body: 'foo bar',
    }, (err, conn) => {
      expect(err).to.be.null;
      expect(conn.req.body.toString()).to.eql('foo bar');
    });
  });
});
