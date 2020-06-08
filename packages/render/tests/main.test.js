/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('grown')();

Grown.use(require('../../test'));
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

  function $(pre, post) {
    return () => {
      server.mount(pre);
      return server.request(post);
    };
  }

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

  it('should render function-views', $(conn => {
    conn.render('fn_view');
  }, (err, conn) => {
    conn.res.ok(err, '<h1>It works!</h1>');
  }));

  it('should render function-views (vnodes)', $(conn => {
    conn.render('sub/h_view');
  }, (err, conn) => {
    conn.res.ok(err, '<h1>It works!</h1>');
  }));

  it('should render from any layout if set', $(conn => {
    conn.render('sub/h_view', { layout: 'test' });
  }, (err, conn) => {
    conn.res.ok(err, '{"layout":"test","contents":"<h1>It works!</h1>"}');
  }));

  it('should render failures found during layout-rendering', $(conn => {
    conn.render('sub/h_view', { layout: 'not_found' });
  }, (err, conn) => {
    conn.res.ok(err, "Failed to render 'not_found' template\nGiven file 'not_found' does not exists");
  }));

  it('should render attributes, including #id and .classes as shorthand', $(conn => {
    conn.render((_, h) => h('m#n.o', null, h('a', {
      class: 'b',
      noop: null,
      bool: true,
      skip: false,
      style: { fontColor: 'red' },
    })));
  }, (err, conn) => {
    conn.res.ok(err, '<m id="n" class="o">\n  <a class="b" bool style="font-color:red"/>\n  \n</m>');
  }));

  it('should render multiple nodes at once', $(conn => {
    conn.render((_, h) => [h('a'), h('b')]);
  }, (err, conn) => {
    conn.res.ok(err, '<a/>\n<b/>\n');
  }));

  it('should render children nodes too', $(conn => {
    conn.render((_, h) => h('x', null, false, (__, hh) => hh('a'), h('y'), '!'));
  }, (err, conn) => {
    conn.res.ok(err, '<x>\n  <a/>\n<y/>\n  !\n</x>');
  }));

  it('should render self-closing tags', $(conn => {
    conn.render((_, h) => h('img'));
  }, (err, conn) => {
    conn.res.ok(err, '<img/>\n');
  }));

  it('should render objects as tags', $(conn => {
    conn.render((_, h) => ({ tag: typeof h }));
  }, (err, conn) => {
    conn.res.ok(err, '<function/>\n');
  }));
});
