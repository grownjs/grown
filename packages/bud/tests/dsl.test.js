/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const stdMocks = require('std-mocks');

const procExit = process.exit;

let Grown;

/* global beforeEach, afterEach, describe, it */

describe('Grown', () => {
  beforeEach(() => {
    Grown = require('../index')();
  });

  it('is a function', () => {
    expect(typeof Grown).to.eql('function');
    expect(typeof Grown.new).to.eql('function');
  });

  describe('#module', () => {
    it('can access its module definition', () => {
      expect(Grown.Dummy).to.be.undefined;

      Grown('Dummy', {
        props: {
          value: 42,
        },
      });

      expect(Grown.Dummy.new().value).to.eql(42);
    });
  });

  describe('#load', () => {
    it('can load definitions from given directories', () => {
      expect(Grown.load(`${__dirname}/fixtures`).Example.truth).to.eql(42);
    });
  });

  describe('#use', () => {
    it('can load new module definitions', () => {
      Grown.use(($, util) => {
        return $('Example', {
          props: {
            _: util,
          },
        });
      });

      const ex = new Grown.Example();

      expect(ex._.flattenArgs(1, [2], [[3]])).to.eql([1, 2, 3]);
      expect(Object.keys(ex)).to.eql([]);
    });
  });

  describe('#do', () => {
    it('can test guard blocks as promises', () => Grown
      .do(() => new Promise(cb => setTimeout(cb, 1000))));

    describe('rescue', () => {
      let calls;

      beforeEach(() => {
        calls = [];
        stdMocks.use();
        process.exit = () => {
          calls.push('exit');
        };
      });

      afterEach(() => {
        stdMocks.restore();
        process.exit = procExit;

        const result = stdMocks.flush();

        // expect(result.stdout).to.eql([]);
        process.stdout.write(result.stdout.join('\n'));

        expect(result.stderr[0]).to.contain('Error: OK');
        expect(calls).to.eql(['guard', 'rescue', 'exit']);
      });

      it('will output to stderr', () => Grown
        .do(rescue => {
          calls.push('guard');

          rescue(() => {
            calls.push('rescue');
          });

          throw new Error('OK');
        })());
    });
  });
});
