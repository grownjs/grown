/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const stdMocks = require('std-mocks');
const td = require('testdouble');
const path = require('path');

let Grown;

/* global beforeEach, afterEach, describe, it */

describe('Grown (bud)', () => {
  beforeEach(() => {
    Grown = require('../index')();
  });

  it('is a function', () => {
    expect(typeof Grown).to.eql('function');
    expect(typeof Grown.new).to.eql('function');
  });

  describe('environment', () => {
    it('should load env-vars from given DATA', () => {
      require('../index')(null, ['foo=bar', 'BAZ=BUZZ']);
      expect(process.env.foo).to.be.undefined;
      expect(process.env.BAZ).to.eql('BUZZ');
    });

    it('should enable debug with verbosity', () => {
      stdMocks.use();
      require('../index')(null, ['--debug', '--verbose']);

      const wasEnabled = require('debug').enabled('*');

      require('debug').disable('*');
      stdMocks.restore();

      expect(wasEnabled).to.be.true;
    });
  });

  describe('configure', () => {
    const dotenv = require('dotenv');

    beforeEach(() => {
      td.replace(dotenv, 'config');
    });

    afterEach(() => {
      td.reset();
    });

    it('should throw when dotenv fails', () => {
      const failure = new Error();

      failure.code = 'UNDEF';

      td.when(dotenv.config({ path: td.matchers.isA(String) }))
        .thenReturn({ error: failure });

      expect(require('../index')).to.throw();
    });

    it('should ignore ENOENT errors', () => {
      td.when(dotenv.config({ path: td.matchers.isA(String) }))
        .thenReturn({ error: { code: 'ENOENT' } });

      expect(require('../index')).not.to.throw();
    });
  });

  describe('instance', () => {
    it('should fail on missing Server module', () => {
      expect(() => new Grown()).to.throw('Missing Grown.Server');
    });

    it('should return a server-instance', () => {
      Grown('Server', {
        create() {
          return {
            props: {
              truth: () => 42,
            },
          };
        },
      });

      expect(new Grown().truth).to.eql(42);
    });
  });

  describe('logger', () => {
    it('should fail on missing Logger module', () => {
      Grown.use((_, util) => {
        expect(() => util.getLogger()).to.throw('Missing Grown.Logger');
      });
    });

    it('should return a logger instance', () => {
      Grown('Logger', {
        getLogger() {
          return 42;
        },
      });

      Grown.use((_, util) => {
        expect(util.getLogger()).to.eql(42);
      });
    });
  });

  describe('callable()', () => {
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

  describe('#argv', () => {
    it('should return any given arguments', () => {
      const test = require('../index')(null, ['--foo', 'bar', 'baz:buzz']);

      expect(test.argv.flags.foo).to.eql('bar');
      expect(test.argv.params).to.eql({ baz: 'buzz' });
    });
  });

  describe('#cwd', () => {
    it('should return any given CWD', () => {
      expect(require('../index')('./foo').cwd).to.eql(path.resolve('./foo'));
    });
  });

  describe('#env', () => {
    it('should return the current NODE_ENV', () => {
      expect(require('../index')(null, ['-e', 'fixed']).env).to.eql('fixed');
    });
  });

  describe('#defn', () => {
    it('should allow to register custom methods', () => {
      const test = require('../index')();

      test.defn('foo', () => 'bar');
      expect(test.foo).to.eql('bar');
    });
  });

  describe('#load', () => {
    it('can load definitions from given directories', () => {
      expect(Grown.load(path.join(__dirname, 'fixtures')).Example.truth).to.eql(42);
    });

    it('should allow to rename loaded definitions', () => {
      expect(Grown.load(path.join(__dirname, 'fixtures'), null, '%Foo').ExampleFoo.truth).to.eql(42);
      expect(Grown.load(path.join(__dirname, 'fixtures'), k => `${k}Bar`).ExampleBar.truth).to.eql(42);
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
      });

      afterEach(() => {
        stdMocks.restore();

        const result = stdMocks.flush();

        expect(result.stdout.length).to.eql(1);
        expect(result.stderr.join('\n')).not.to.contain('Error: OK');
        expect(calls).to.eql(['guard', 'rescue']);
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
