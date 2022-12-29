/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const path = require('path');

const { cmd, bin } = require('./helpers');

/* global describe, it */

describe('Grown.CLI', () => {
  it('should handle no-package.json', () => {
    return cmd('empty', bin()).then(({ stdout, stderr, failure }) => {
      expect(stderr).to.eql('');
      expect(stdout).to.contain('Add --help to any command for usage info.');
      expect(failure).to.be.null;
    });
  });

  it('should call wrapped command', () => {
    return cmd('sample', bin()).then(({ stdout, stderr, failure }) => {
      expect(stderr).to.eql('');
      expect(stdout).to.contain('Add --help to any command for usage info.');
      expect(failure).to.be.null;
    });
  });

  describe('Tasks', () => {
    it('should list found tasks', () => {
      return cmd('sample', bin('example --help')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('This line will be shown as summary');
        expect(stdout).to.contain('And this description is shown when --help is given.');
        expect(failure).to.be.null;
      });
    });

    it('should be able to run tasks', () => {
      return cmd('sample', bin('example')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('OSOM');
        expect(failure).to.be.null;
      });
    });

    it('should report on unknown tasks', () => {
      return cmd('sample', bin('undefined')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('Task undefined is not registered');
        expect(failure).not.to.be.null;
      });
    });

    it('should report on failed tasks', () => {
      return cmd('sample', bin('broken')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('[broken] (Error) Unexpected');
        expect(failure).not.to.be.null;
      });
    });
  });

  describe('Errors', () => {
    it('should report multiple errors', () => {
      return cmd('errored', bin('server --app multiple.js')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('─ SINGLE_ERROR (undefined)');
        expect(stdout).to.contain('─ [server] Error');
        expect(failure).not.to.be.null;
      });
    });

    it('should report original errors', () => {
      return cmd('errored', bin('server --app original.js')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('⚠ SOME DETAIL INFO');
        expect(stdout).to.contain('⚠ ORIGINAL_ERROR');
        expect(failure).not.to.be.null;
      });
    });

    it('should report stack-less errors', () => {
      return cmd('errored', bin('server --app no-stack.js --debug')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('─ [server] NO_STACK');
        expect(failure).not.to.be.null;
      });
    });

    it('should handle subtasks', () => {
      return cmd('sample', bin('subtest')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('subtest');
        expect(stdout).to.contain('DONE');
        expect(failure).to.be.null;
      });
    });

    it('should report rejections', () => {
      return cmd('sample', bin('subtest throw')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('subtest');
        expect(stdout).to.contain('─ (Error) UNHANDLED_REJECTION');
        expect(failure).not.to.be.null;
      });
    });

    it('should report errors', () => {
      return cmd('sample', bin('subtest error')).then(({ stdout, stderr, failure }) => {
        expect(stdout).to.contain('subtest');
        expect(stderr).to.contain('FAILED');
        expect(failure).not.to.be.null;
      });
    });
  });

  describe('Subshell', () => {
    const TEST_JS = path.join(__dirname, 'fixtures/test.js');

    it('should handle custom commands', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS}`)).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('DONE');
        expect(stdout).to.contain('OSOM');
        expect(stdout).to.contain('example');
        expect(stdout).to.contain('Done');
        expect(failure).to.be.null;
      });
    });

    it('should report missed-rejections', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS} throw`)).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.include('Error: UNHANDLED_REJECTION');
        expect(stdout).to.contain('OSOM');
        expect(stdout).to.contain('example');
        expect(stdout).not.to.contain('Done');
        expect(failure).not.to.be.null;
      });
    });

    it('should report SIGINT-calls', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS} wait`), true).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).not.to.contain('DONE');

        if (failure !== null) {
          expect(failure.signal).to.eql('SIGINT');
        }
      });
    });

    it('should report trap errors', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS} error`)).then(({ stdout, stderr, failure }) => {
        expect(stdout.split('\n').length > 2).to.be.true;
        expect(stderr).to.eql('FAILED\n');
        expect(failure).not.to.be.null;
      });
    });
  });

  describe('Application', () => {
    it('should fail if --app is not found', () => {
      return cmd('sample', bin('server start')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('Missing application script');
        expect(failure).not.to.be.null;
      });
    });

    it('should fail if --app is empty', () => {
      return cmd('app', bin('server start')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('[server] (Error) Missing listen()');
        expect(failure).not.to.be.null;
      });
    });

    it('should fail if --app is broken', () => {
      return cmd('app', bin('server start --app broken.js')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('[server] (Error) Missing listen()');
        expect(failure).not.to.be.null;
      });
    });

    it('should allow custom --app', () => {
      return cmd('app', bin('server start --app working.js')).then(({ stdout, stderr, failure }) => {
        expect(stderr).to.eql('');
        expect(stdout).to.contain('WORKING...');
        expect(stdout).to.contain('LISTENING...');
        expect(failure).to.be.null;
      });
    });
  });
});
