/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('../../bud')();

Grown.use(require('../../server'));
Grown.use(require('../../test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('Grown.Logger', () => {
  let buffer;

  beforeEach(() => {
    buffer = [];
    Grown.Logger.setLogger({
      write: x => buffer.push(x),
    });
  });

  it('should reformat printed items', () => {
    Grown.Logger.message('- Item');
    expect(buffer[0]).to.contain('─ Item');
  });

  it('should reformat printed messages', () => {
    Grown.Logger.message('Hello world');
    expect(buffer[0]).to.contain('› Hello world');
  });

  it('should reformat printed exceptions', () => {
    Grown.Logger.error('Just an exception');
    expect(buffer[0]).to.contain('─ Just an exception');
  });

  it('should reformat printed write/read info', () => {
    Grown.Logger.message('write stuff');

    return Promise.resolve().then(() => {
      expect(buffer[0]).to.eql('\b');
      expect(buffer[1]).to.contain('✔ stuff');
    });
  });

  it('should decorate server and connection', () => {
    const server = new Grown();

    Grown.Logger.setLevel('debug');

    server.plug([Grown.Logger, Grown.Test]);

    server.mount(conn => {
      expect(server.logger).to.eql(conn.logger);
    });

    return server.request('/', (err, conn) => {
      expect(buffer[0]).to.match(/GET.*\/.*\d+ms/);
      expect(conn.res.getHeader('x-response-time')).to.match(/\d+ms/);
    });
  });

  it('should responds to Conn/Render if available', () => {
    const server = new Grown();

    const tpl1 = {
      contents: 'FIXME: {elapsed}',
    };

    const tpl2 = {
      contents: 'FIXME',
    };

    server.plug([
      Grown.Logger,
      Grown.Test,
      {
        $install(ctx) {
          ctx.mount(conn => {
            if (conn.req.url === '/fixed') {
              ctx.emit('before_render', conn, tpl1);
            } else {
              ctx.emit('before_render', conn, tpl2);
            }
          });
        },
        $mixins() {
          return {
            methods: {
              put_resp_header() {},
              end() { this.res.end(); },
            },
          };
        },
      },
    ]);

    return Promise.resolve()
      .then(() => server.request('/fixed', () => expect(tpl1.contents).to.match(/FIXME: \dms/)))
      .then(() => server.request('/', () => expect(tpl2.contents).to.match(/FIXME<p>.*\dms<\/p>/)));
  });
});
