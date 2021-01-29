/* global beforeEach, afterEach, describe, it */

const td = require('testdouble');
const { expect } = require('chai');
const Grown = require('../../bud')();

Grown.use(require('../../server'));
Grown.use(require('..'));

function tick(ms) {
  return new Promise(ok => setTimeout(ok, ms));
}

describe('Grown.Test', () => {
  let server;

  beforeEach(() => {
    server = new Grown();
    server.plug(Grown.Test);
    server.mount(conn => {
      conn.res.setHeader('Content-Type', 'text/html');
      conn.res.status(200).send('<!DOCTYPE html>');
    });
  });

  describe('Request', () => {
    it('should allow requests through the given server', () => {
      return server.request('/', (err, conn) => {
        conn.res.ok(err, '<!DOCTYPE html>');
      });
    });
  });

  describe('Sockets', () => {
    let wss;
    beforeEach(() => {
      wss = server.sockets();
    });
    afterEach(() => {
      wss.stop();
    });

    it('should allow to test web-sockets', async () => {
      const callback = td.func('onmessage');

      server.on('open', ws => {
        ws.on('message', callback);
      });

      const client = wss.connect();
      client.send();

      await tick(5);
      expect(td.explain(callback).callCount).to.eql(1);
    });
  });
});
