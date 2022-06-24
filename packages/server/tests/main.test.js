/* eslint-disable no-unused-expressions */

const td = require('testdouble');
const FormData = require('form-data');
const WebSocket = require('ws');
const { expect } = require('chai');
const { get, post } = require('httpie');

let Grown;
let g;

/* global beforeEach, afterEach, describe, it */

describe('Grown.Server', () => {
  beforeEach(() => {
    Grown = require('../../bud')();
    Grown.use(require('..'));
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

      it('should normalize the request body', () => {
        const opts = {
          body: { foo: 'bar' },
          method: 'POST',
          headers: {
            'content-type': 'multipart/form-data',
          },
        };

        return g.request(opts, (err, conn) => {
          expect(conn.pid).not.to.be.undefined;

          conn.req.on('data', chunk => {
            expect(chunk.toString()).to.contain('Content-Disposition: form-data; name="foo"');
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
    });

    if (!process.env.U_WEBSOCKETS_SKIP) {
      describe('uWebSockets.js', () => {
        beforeEach(() => {
          g = Grown.new();
        });

        it('should responds with 501 as default', done => {
          g.listen(3000, async app => {
            let err;
            try {
              await get('http://0.0.0.0:3000');
            } catch (e) {
              err = e;
            }

            expect(err.statusMessage).to.eql('Not Implemented');
            expect(err.statusCode).to.eql(501);

            app.close();
            done();
          });
        });

        it('should responds with 200 if ctx.res.status() is called', done => {
          g.mount(ctx => ctx.res.status(200).end());
          g.listen(3000, async app => {
            const { statusCode } = await get('http://0.0.0.0:3000');

            expect(statusCode).to.eql(200);
            app.close();
            done();
          });
        });

        it('should parse multipart/x-www-form-urlencoded', done => {
          g.mount(ctx => {
            ctx.res.write(JSON.stringify(ctx.req.body));
            ctx.res.status(200).end();
          });

          g.listen(3000, async app => {
            const { data } = await post('http://0.0.0.0:3000', {
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

        it('should parse multipart/form-data', done => {
          g.mount(ctx => {
            ctx.res.write(JSON.stringify(ctx.req.body));
            ctx.res.status(200).end();
          });

          g.listen(3000, async app => {
            const payload = new FormData();
            payload.append('foo', 'bar');

            const { data } = await post('http://0.0.0.0:3000', {
              headers: payload.getHeaders(),
              body: payload.getBuffer(),
            });

            expect(data).to.eql('{"foo":"bar"}');
            app.close();
            done();
          });
        });

        it('should parse application/json', done => {
          g.mount(ctx => {
            ctx.res.write(JSON.stringify(ctx.req.body));
            ctx.res.status(200).end();
          });

          g.listen(3000, async app => {
            const { data } = await post('http://0.0.0.0:3000', {
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
            ctx.res.status(200).end();
          });

          g.mount(ctx => {
            ctx.res.write('):');
            ctx.res.status(200).end();
          });

          g.listen(3000, async app => {
            const { data: a } = await get('http://0.0.0.0:3000/ko');
            const { data: b } = await get('http://0.0.0.0:3000/x');

            expect(a).to.eql('OK');
            expect(b).to.eql('):');
            app.close();
            done();
          });
        });

        it('should handle web-sockets', done => {
          const evts = [];

          g.on('open', ws => {
            ws.on('message', x => evts.push(x));
            ws.send('STUFF');
          });

          g.listen(3000, async app => {
            const ws = new WebSocket('ws://0.0.0.0:3000');

            ws.on('open', () => {
              ws.send(JSON.stringify({ foo: 42 }));
            });
            ws.on('message', data => {
              evts.push(data);
              setTimeout(() => ws.terminate(), 100);
            });

            ws.on('close', () => evts.push('close'));

            setTimeout(() => {
              expect(evts).to.eql(['STUFF', '{"foo":42}', 'close']);
              expect(g.clients()).to.eql([]);
              app.close();
              done();
            }, 200);
          });
        });

        it('should fire startup events', done => {
          const ev = td.func('callback');

          g.on('done', ev);
          g.on('ready', ev);
          g.on('listen', ev);
          g.listen(3000, app => {
            expect(td.explain(ev).callCount).to.eql(3);
            app.close();
            done();
          });
        });
      });
    }

    describe('HTTP(s)', () => {
      beforeEach(() => {
        process.env.U_WEBSOCKETS_SKIP = 'true';
        g = Grown.new({ body: true });
      });

      afterEach(() => {
        process.env.U_WEBSOCKETS_SKIP = '';
      });

      it('should fallback to nodejs modules if U_WEBSOCKETS_SKIP is set', done => {
        g.mount(ctx => {
          ctx.res.write(JSON.stringify(ctx.req.body));
          ctx.res.status(200).end();
        });

        g.listen(3000, async app => {
          const { data } = await post('http://0.0.0.0:3000', {
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
          ctx.res.status(200).end();
        });

        g.mount(ctx => {
          ctx.res.write('):');
          ctx.res.status(200).end();
        });

        g.listen(3000, async app => {
          const { data: a } = await get('http://0.0.0.0:3000/x');
          const { data: b } = await get('http://0.0.0.0:3000/ko');

          expect(a).to.eql('):');
          expect(b).to.eql('OK');
          app.close();
          done();
        });
      });

      it('should handle web-sockets', done => {
        const evts = [];

        g.on('open', ws => {
          ws.on('message', x => evts.push(x));
          ws.send('STUFF');
        });

        g.listen(3000, async app => {
          const ws = new WebSocket('ws://0.0.0.0:3000');

          ws.on('open', () => {
            ws.send(JSON.stringify({ foo: 42 }));
          });
          ws.on('message', data => {
            evts.push(data);
            setTimeout(() => ws.terminate(), 100);
          });

          ws.on('close', () => evts.push('close'));

          setTimeout(() => {
            expect(evts).to.eql(['STUFF', '{"foo":42}', 'close']);
            expect(g.clients()).to.eql([]);
            app.close();
            done();
          }, 200);
        });
      });

      it('should fire startup events', done => {
        const ev = td.func('callback');

        g.on('done', ev);
        g.on('ready', ev);
        g.on('listen', ev);
        g.listen(3000, app => {
          expect(td.explain(ev).callCount).to.eql(3);
          app.close();
          done();
        });
      });

      it('should handle raw-body', done => {
        g.mount(ctx => {
          ctx.res.write(ctx.req.body);
          ctx.res.status(200).end();
        });

        g.listen(3000, async app => {
          const { data } = await post('http://0.0.0.0:3000', {
            body: '{"x":"y"}',
          });

          expect(data).to.eql('{"x":"y"}');
          app.close();
          done();
        });
      });

      it('should handle errors', done => {
        let error;
        g.on('failure', err => {
          error = err;
        });

        g.listen(3000, async app => {
          try {
            await post('http://0.0.0.0:3000', {
              headers: {
                'Content-Type': 'application/json',
              },
              body: 'OSOM',
            });
          } catch (e) {
            // skip
          }

          expect(error.message).to.contain('Error decoding input (JSON)');
          app.close();
          done();
        });
      });
    });
  });
});
