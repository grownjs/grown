/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('grown')();

Grown.use(require('../../test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('Grown.Access', () => {
  let server;

  beforeEach(() => {
    server = new Grown();
    server.mount(conn => conn.req.end());
    server.plug(Grown.Test);
  });

  it('should validate given input', () => {
    expect(() => server.plug(Grown.Access.rules())).to.throw('No role-groups were defined');
    expect(() => server.plug(Grown.Access.rules({ roles: 'Foo.Bar' }))).to.throw('Ruleset cannot be empty');
  });

  it('should allow requests without access', () => {
    return server.request('/im_not_exists', (err, conn) => {
      expect(conn.res.statusCode).to.eql(200);
    });
  });

  it('should warn about invalid routes', () => {
    expect(() => server.plug(Grown.Access.rules({
      roles: 'Guest',
      resources: {
        Sample: /^test/,
        Broken: '/x-path(',
      },
    }))).to.throw("Cannot compile '/x-path(' as route handler");
  });

  describe('Resources', () => {
    let role;

    beforeEach(() => {
      server.plug(Grown.Access({
        access_filter: () => role,
        access_rules: {
          roles: [
            'Guest.User.Editor.Admin',
          ],
          resources: {
            Fixed: '/**',
            Public: '/ok',
            System: '/admin',
            Dynamic: '/testing',
            Example: '/protected',
            'Example.create': 'POST /protected',
          },
          permissions: {
            Example: {
              Admin: 'allow',
            },
            System: {
              Admin: 'allow',
              Editor: 'inherit',
            },
            Public: {
              Guest: 'allow',
              User: 'deny',
            },
            Fixed: {
              User: 'inherit',
            },
            Dynamic: {
              Guest: conn => conn.req.headers['x-password'] === '42',
            },
          },
        },
      }));
    });

    it('should validate all requested resources', () => {
      return server.request('/im_not_exists', (err, conn) => {
        expect(conn.res.statusCode).to.eql(403);
        expect(conn.res.statusMessage).to.eql('Forbidden');
        expect(conn.res.getHeader('X-Failure')).to.eql('Access denied for role: Unknown');
      });
    });

    it('should allow some protected resources', () => {
      role = 'Admin';
      return server.request('/protected', (err, conn) => {
        expect(conn.res.statusCode).to.eql(200);
        expect(conn.res.statusMessage).to.eql('OK');
      });
    });

    it('should deny some protected resources', () => {
      role = 'User';
      return server.request('/protected', (err, conn) => {
        expect(conn.res.statusCode).to.eql(403);
        expect(conn.res.statusMessage).to.eql('Forbidden');
        expect(conn.res.getHeader('X-Failure')).to.eql('Access denied for role: User');
      });
    });

    it('should allow inheritance of access', () => {
      role = 'Editor';
      return server.request('/admin', (err, conn) => {
        expect(conn.res.statusCode).to.eql(200);
        expect(conn.res.statusMessage).to.eql('OK');
      });
    });

    it('should allow denial of some resources', () => {
      role = 'User';
      return server.request('/ok', (err, conn) => {
        expect(conn.res.statusCode).to.eql(403);
        expect(conn.res.statusMessage).to.eql('Forbidden');
        expect(conn.res.getHeader('X-Failure')).to.eql('Access denied for role: User');
      });
    });

    it('should allow access by inheritance', () => {
      role = 'Admin';
      return server.request('/ok', (err, conn) => {
        expect(conn.res.statusCode).to.eql(200);
        expect(conn.res.statusMessage).to.eql('OK');
      });
    });

    it('should inherit from previous access', () => {
      role = 'User';
      return server.request('/x', (err, conn) => {
        expect(conn.res.statusCode).to.eql(200);
        expect(conn.res.statusMessage).to.eql('OK');
      });
    });

    it('should allow dynamic permissions', () => {
      role = 'Guest';
      return server.request('/testing', {
        headers: {
          'x-password': 42,
        },
      }, (err, conn) => {
        expect(conn.res.statusCode).to.eql(200);
        expect(conn.res.statusMessage).to.eql('OK');
      });
    });

    it('should allow static check() calls', () => {
      return server.request('/', (err, conn) => Promise.resolve()
        .then(() => conn.check('Guest', ['Example', 'create'])
          .catch(e => expect(e.message).to.eql('Access denied for role: Guest')))
        .then(() => conn.check('Guest', 'Example', 'create')
          .catch(e => expect(e.message).to.eql('Access denied for role: Guest')))
        .then(() => conn.check('Other', 'Example')
          .catch(e => expect(e.message).to.eql('Access denied for role: Other')))
        .then(() => expect(err).to.be.null));
    });
  });
});
