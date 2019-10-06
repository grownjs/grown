/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('grown')();

Grown.use(require('@grown/test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('Supported access rules', () => {
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

  describe('Resources', () => {
    let role;

    beforeEach(() => {
      server.plug(Grown.Access({
        permissions: {
          Example: () => role === 'Admin',
        },
        access_filter: () => role,
        access_rules: {
          roles: [
            'User.Admin',
          ],
          resources: {
            Example: '/protected',
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
  });
});
