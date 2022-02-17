const { expect } = require('chai');

const Grown = require('../../bud')();

Grown.use(require('../../server'));
Grown.use(require('../../test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('integration', () => {
  let server;
  beforeEach(() => {
    server = new Grown();
    server.plug(Grown.Test);
    server.plug(Grown.Cache);
  });

  it('should propagate a cache prop', async () => {
    await server.cache.set('foo', 'BAR');

    server.mount(async conn => {
      const result = await server.cache.get('foo');

      conn.res.end(result);
    });

    await server.request('/', (err, conn) => {
      conn.res.ok(err, 'BAR');
    });

    await server.cache.close();
  });

  it('should allow custom connections', async () => {
    const cache = server.cached('custom');

    let hits = 0;
    server.mount(async conn => {
      const key = conn.req.url;
      const temp = conn.cached('custom');
      const cached = await temp.get(key);

      if (cached !== null) {
        return conn.res.end(cached);
      }

      hits += 1;
      conn.res.end('OK');

      await temp.set(key, 'OK', 'ex', 1);
    });

    await server.request('/', (err, conn) => {
      conn.res.ok(err, 'OK');
    });

    await server.request('/', (err, conn) => {
      conn.res.ok(err, 'OK');
    });

    await cache.close();

    expect(hits).to.eql(1);
  });
});
