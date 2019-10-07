/* eslint-disable no-unused-expressions */

const { expect } = require('chai');

let Grown;
let g;

/* global beforeEach, describe, it */

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
  });
});
