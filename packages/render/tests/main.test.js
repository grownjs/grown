/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('grown')();

Grown.use(require('@grown/test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('Grown.Render', () => {
  let server;

  beforeEach(() => {
    server = new Grown();
    server.plug(Grown.Render({
      view_folders: [`${__dirname}/fixtures`],
    }));
    server.plug(Grown.Test);
  });

  it('should fail on missing views', () => {
    let error;
    server.mount(conn => {
      try {
        conn.render('not_found');
      } catch (e) { error = e.message; }
    });

    return server.request((err, conn) => {
      conn.res.ok(err);

      expect(error).to.contain("Failed to render 'not_found' template");
      expect(error).to.contain("Given file 'not_found' does not exists");
    });
  });

  it('should render function-views', () => {
    server.mount(conn => {
      conn.render('fn_view');
    });

    return server.request((err, conn) => {
      conn.res.ok(err, '<h1>It works!</h1>');
    });
  });

  it('should render function-views (vnodes)', () => {
    server.mount(conn => {
      conn.render('sub/h_view');
    });

    return server.request((err, conn) => {
      conn.res.ok(err, '<h1>It works!</h1>');
    });
  });

  it('should render from any layout if set', () => {
    server.mount(conn => {
      conn.render('sub/h_view', { layout: 'test' });
    });

    return server.request((err, conn) => {
      conn.res.ok(err, '{"layout":"test","contents":"<h1>It works!</h1>"}');
    });
  });

  it('should render failures found during layout-rendering', () => {
    server.mount(conn => {
      conn.render('sub/h_view', { layout: 'not_found' });
    });

    return server.request((err, conn) => {
      conn.res.ok(err, "Failed to render 'not_found' template\nGiven file 'not_found' does not exists");
    });
  });
});
