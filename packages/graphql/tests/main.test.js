/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const path = require('path');

const Grown = require('../../..')();

Grown.use(require('../../test'));
Grown.use(require('..'));

/* global describe, it */

function mockServer(schemas, registry, container = {}, onBefore = () => {}) {
  const middleware = Grown.GraphQL.setup(schemas, {
    registry,
    get: () => container,
    forEach: cb => cb(container),
  });

  const server = new Grown();

  server.plug(Grown.Test);
  server.mount(onBefore);
  server.mount(middleware);

  return server;
}

describe('Grown.GraphQL', () => {
  const validSchemas = [
    path.join(__dirname, 'fixtures/test.gql'),
  ];

  const validRegistry = {
    Query: {},
  };

  const validContainer = {
    Query: {
      example() {
        return {
          truth: 42,
        };
      },
      broken() {
        throw new Error('WAT');
      },
    },
  };

  it('should validate its input', () => {
    expect(() => mockServer()).to.throw(/Missing or invalid schemas/);
    expect(() => mockServer([])).to.throw(/Missing or invalid container/);
    expect(() => mockServer(['WAT'], validRegistry)).to.throw(/Unable to load schema/);
    expect(() => mockServer(validSchemas, validRegistry)).not.to.throw();
    expect(() => mockServer(validSchemas, validRegistry, { Query: { notFunction: -1 } })).to.throw(/Expecting notFunction/);
  });

  it('should validate missing input from GET requests', () => {
    return mockServer(validSchemas, validRegistry, validContainer)
      .request('/', { query: null }, (err, conn) => {
        conn.res.ok(err, /Missing input body or query/, 422);
      });
  });

  it('should validate missing input from POST requests', () => {
    return mockServer(validSchemas, validRegistry, validContainer)
      .request('/', 'POST', (err, conn) => {
        conn.res.ok(err, /Missing input body or query/, 422);
      });
  });

  it('should allow GET requests with query.body', () => {
    return mockServer(validSchemas, validRegistry, validContainer)
      .request('/?body=query{example{truth}}', (err, conn) => {
        conn.res.ok(err, '{"data":{"example":{"truth":42}}}');
      });
  });

  it('should allow POST requests with body.query', () => {
    return mockServer(validSchemas, validRegistry, validContainer)
      .request('/', {
        method: 'POST',
        body: {
          query: 'query{example{truth}}',
        },
      }, (err, conn) => {
        conn.res.ok(err, '{"data":{"example":{"truth":42}}}');
      });
  });

  it('should return any error from handlers', () => {
    return mockServer(validSchemas, validRegistry, validContainer)
      .request('/', { query: { body: 'query{broken{test}}' } }, (err, conn) => {
        conn.res.ok(err, /Error: WAT/, 400);
      });
  });

  it('should return any errors as user-error', () => {
    return mockServer(validSchemas, validRegistry, validContainer)
      .request('/', { query: { body: 'query{example{undef}}' } }, (err, conn) => {
        conn.res.ok(err, /Cannot query field/, 400);
      });
  });

  it('should keep status-code > 200', () => {
    return mockServer(validSchemas, validRegistry, validContainer, conn => { conn.res.statusCode = 401; })
      .request('/', { query: { body: 'query{example{undef}}' } }, (err, conn) => {
        conn.res.ok(err, /Cannot query field/, 401);
      });
  });
});
