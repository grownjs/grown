/* global beforeEach, describe, it */

const Grown = require('@grown/bud')();

Grown.use(require('@grown/server'));
Grown.use(require('..'));

describe('Grown.Test', () => {
  let server;

  beforeEach(() => {
    server = new Grown();
    server.plug(Grown.Test);
    server.mount(conn => {
      conn.res.setHeader('Content-Type', 'text/html');
      conn.res.write('<!DOCTYPE html>');
      conn.res.status(200).end();
    })
  });

  describe('Request', () => {
    it('should allow requests through the given server', () => {
      return server.request('/', (err, conn) => {
        conn.res.ok(err, '<!DOCTYPE html>');
      });
    });
  });
});
