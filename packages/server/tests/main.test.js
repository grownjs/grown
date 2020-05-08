/* eslint-disable no-unused-expressions */

const { expect } = require('chai');
const { get, post } = require('httpie');

let Grown;
let g;

/* global beforeEach, afterEach, describe, it */

describe('Grown.Server', () => {
  beforeEach(() => {
    Grown = require('../../bud')();
    Grown.use(require('../'));
    Grown.use(require('../../test'));
  });

  describe('Integration tests', () => {
    beforeEach(() => {
      g = Grown.new();
      g.plug(Grown.Test);
    });

    describe('#plug -> #mount -> #listen -> #request', () => {
      it('runs over the current instance', () => {
        const g1 = g.plug({
          $mixins: {
            props: {
              value: 42,
            },
          },
        });
        expect(g).to.eql(g1);

        let test = null;

        g.mount(conn => {
          test = conn.value;
        });

        return g.request(() => {
          expect(test).to.eql(42);
        });
      });

      it('should normalize the request body', () => {
        const opts = {
          body: '"OSOM"',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        };

        return g.request(opts, (err, conn) => {
          expect(conn.req.headers['content-length']).to.eql('6');
          expect(conn.pid).not.to.be.undefined;

          conn.req.on('data', chunk => {
            expect(chunk.toString()).to.eql('"OSOM"');
          });
        });
      });
    });

    describe('Mock.Req', () => {
      it('provides a mocked request', () => {
        return g.run().then(conn => {
          expect(conn.req).not.to.be.undefined;
          expect(conn.req.url).to.eql('');
        });
      });
    });

    describe('Mock.Res', () => {
      it('provides a mocked response', () => {
        g.mount(conn => {
          return conn.res.write('OSOM');
        });

        return g.run().then(conn => {
          expect(conn.res.body).to.eql('OSOM');
        });
      });
    });

    describe('Event emitter', () => {
      it('can chain many method calls', () => {
        const cb = () => {};

        expect(g.on('x', cb).off('x', cb)).to.eql(g);
      });

      it('will emit asynchronously', () => {
        let call = null;

        g.on('async', () => {
          return new Promise(ok => {
            setTimeout(() => {
              call = true;
              ok();
            }, 100);
          });
        });

        return g.emit('async').then(() => {
          expect(call).to.eql(true);
        });
      });

      it('will emit in sequence', () => {
        const call = [];

        g.on('async-seq', () => {
          return new Promise(ok => {
            setTimeout(() => {
              call.push(1);
              ok();
            }, 200);
          });
        });

        g.on('async-seq', () => {
          return new Promise(ok => {
            setTimeout(() => {
              call.push(2);
              ok();
            }, 100);
          });
        });

        return g.emit('async-seq').then(() => {
          expect(call).to.eql([1, 2]);
        });
      });
    });

    if (!process.env.U_WEBSOCKETS_SKIP) {
      describe('uWebSockets.js', () => {
        beforeEach(() => {
          g = Grown.new();
        });

        it('should responds with 501 as default', done => {
          g.listen(async app => {
            let err;
            try {
              await get('http://0.0.0.0:80');
            } catch (e) {
              err = e;
            }

            expect(err.statusMessage).to.eql('Not Implemented');
            expect(err.statusCode).to.eql(501);

            app.close();
            done();
          });
        });

        it('should responds with 200 if ctx.res.end() is called', done => {
          g.mount(ctx => ctx.res.end());
          g.listen(async app => {
            const { statusCode } = await get('http://0.0.0.0:80');

            expect(statusCode).to.eql(200);
            app.close();
            done();
          });
        });

        it('should parse multipart/x-www-form-urlencoded', done => {
          g.mount(ctx => {
            ctx.res.write(JSON.stringify(ctx.req.body));
            ctx.res.end();
          });

          g.listen(async app => {
            const { data } = await post('http://0.0.0.0:80', {
              headers: {
                'Content-Type': 'multipart/x-www-form-urlencoded',
              },
              body: 'x=y',
            });

            expect(data).to.eql('{"x":"y"}');
            app.close();
            done();
          });
        });

        it('should parse application/json', done => {
          g.mount(ctx => {
            ctx.res.write(JSON.stringify(ctx.req.body));
            ctx.res.end();
          });

          g.listen(async app => {
            const { data } = await post('http://0.0.0.0:80', {
              headers: {
                'Content-Type': 'application/json',
              },
              body: '{"a":"b"}',
            });

            expect(data).to.eql('{"a":"b"}');
            app.close();
            done();
          });
        });

        it('should handle mount-points', done => {
          g.mount('/ko', ctx => {
            ctx.res.write('OK');
            ctx.res.end();
          });

          g.mount(ctx => {
            ctx.res.write('):');
            ctx.res.end();
          });

          g.listen(async app => {
            const { data: a } = await get('http://0.0.0.0:80/ko');
            const { data: b } = await get('http://0.0.0.0:80/x');

            expect(a).to.eql('OK');
            expect(b).to.eql('):');
            app.close();
            done();
          });
        });
      });
    }

    describe('HTTP(s)', () => {
      beforeEach(() => {
        process.env.U_WEBSOCKETS_SKIP = 'true';
      });

      afterEach(() => {
        process.env.U_WEBSOCKETS_SKIP = '';
      });

      it('should fallback to native modules if U_WEBSOCKETS_SKIP is set', done => {
        g = Grown.new();
        g.plug(require('body-parser').json());
        g.mount(ctx => {
          ctx.res.write(JSON.stringify(ctx.req.body));
          ctx.res.end();
        });

        g.listen(async app => {
          const { data } = await post('http://0.0.0.0:80', {
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"a":"b"}',
          });

          expect(data).to.eql('{"a":"b"}');
          app.close();
          done();
        });
      });

      it('should handle mount-points', done => {
        g = Grown.new();
        g.mount('/ko', ctx => {
          ctx.res.write('OK');
          ctx.res.end();
        });

        g.mount(ctx => {
          ctx.res.write('):');
          ctx.res.end();
        });

        g.listen(async app => {
          const { data: a } = await get('http://0.0.0.0:80/x');
          const { data: b } = await get('http://0.0.0.0:80/ko');

          expect(a).to.eql('):');
          expect(b).to.eql('OK');
          app.close();
          done();
        });
      });
    });
  });
});
