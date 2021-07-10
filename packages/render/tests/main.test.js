/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('../../..')();

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
    server.mount(conn => {
      return conn.render('not_found');
    });

    return server.request((err, conn) => {
      expect(err).to.be.null;
      expect(conn.res.body).to.contain("Failed to render 'not_found' template");
      expect(conn.res.body).to.contain("Given file 'not_found' does not exists");
    });
  });

  it('should render function-views', $(conn => {
    return conn.render('fn_view');
  }, (err, conn) => {
    conn.res.ok(err, '<h1>It works!</h1>');
  }));

  it('should render function-views (vnodes)', $(conn => {
    return conn.render('sub/h_view');
  }, (err, conn) => {
    conn.res.ok(err, '<h1>It works!</h1>');
  }));

  it('should render from any layout if set', $(conn => {
    return conn.render('sub/h_view', { layout: 'test' });
  }, (err, conn) => {
    conn.res.ok(err, '{"layout":"test","contents":"<h1>It works!</h1>"}');
  }));

  it('should render from the default layout if set', $(conn => {
    conn.append('head', () => `<title>URL: ${conn.req.url}</title>`);
    conn.append('head', () => '<style>*{margin:0}</style>');
    conn.res.layout = 'default';

    return conn.render('sub/h_view');
  }, (err, conn) => {
    conn.res.ok(err, '<h1>It works!</h1>');
    expect(conn.res.body).to.contains('<title>URL: /</title>');
    expect(conn.res.body).to.contains('<style>*{margin:0}</style>');
  }));

  it('should render failures found during layout-rendering', $(conn => {
    return conn.render('sub/h_view', { layout: 'not_found' });
  }, (err, conn) => {
    conn.res.ok(err, "Failed to render 'not_found' template\nGiven file 'not_found' does not exists");
  }));

  it('should render attributes, including #id and .classes as shorthand', $(conn => {
    return conn.render((_, h) => h('m#n.o', null, h('a', {
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
    return conn.render((_, h) => [h('a'), h('b')]);
  }, (err, conn) => {
    conn.res.ok(err, '<a/>\n<b/>\n');
  }));

  it('should render children nodes too', $(conn => {
    return conn.render((_, h) => h('x', null, false, (__, hh) => hh('a'), h('y'), '!'));
  }, (err, conn) => {
    conn.res.ok(err, '<x>\n  <a/>\n<y/>\n  !\n</x>');
  }));

  it('should render self-closing tags', $(conn => {
    return conn.render((_, h) => h('img'));
  }, (err, conn) => {
    conn.res.ok(err, '<img/>\n');
  }));

  it('should render objects as tags', $(conn => {
    return conn.render((_, h) => ({ tag: typeof h }));
  }, (err, conn) => {
    conn.res.ok(err, '<function/>\n');
  }));

  it('should support consolidate', $(async conn => {
    conn.res.write(await conn.template('sample.pug', { value: 42 }));
  }, (err, conn) => {
    conn.res.ok(err, '<h1>It works.</h1>');
  }));
});
