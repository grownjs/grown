/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const { exec } = require('child_process');

const _close = process.version.split('.')[1] === '6' ? 'exit' : 'close';

const cmd = (cwd, argv, sigkill) => new Promise(next => {
  const execCommand = {
    stdout: '',
    stderr: '',
    exitStatus: null,
  };

  const child = exec(argv, { cwd: `${__dirname}/fixtures/${cwd}` }, (error, out, err) => {
    execCommand.failure = error || null;
    execCommand.stdout += out;
    execCommand.stderr += err;

    if ((error != null ? error.code : void 0) != null) {
      execCommand.exitStatus = error.code;
    }

    next(execCommand);
  });

  const _close = process.version.split('.')[1] === '6' ? 'exit' : 'close';

  child.on(_close, code => {
    execCommand.exitStatus = code;
  });

  if (sigkill) setTimeout(() => child.kill('SIGINT'), 100);
});

const bin = argv => ['node', require('path').resolve(__dirname, 'fixtures/cli.js')].concat(argv || []).join(' ');

/* global describe, it */

describe('Integration process', () => {
  it('should handle no-package.json', () => {
    return cmd('empty', bin()).then(({ stdout, stderr, failure }) => {
      expect(failure).to.be.null;
      expect(stderr).to.eql('');
      expect(stdout).to.contain('Add --help to any command for usage info.');
    });
  });

  it('should call wrapped command', () => {
    return cmd('sample', bin()).then(({ stdout, stderr, failure }) => {
      expect(failure).to.be.null;
      expect(stderr).to.eql('');
      expect(stdout).to.contain('Add --help to any command for usage info.');
    });
  });

  describe('Tasks', () => {
    it('should list found tasks', () => {
      return cmd('sample', bin('example --help')).then(({ stdout, stderr, failure }) => {
        expect(failure).to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('This line will be shown as summary');
        expect(stdout).to.contain('And this description is shown when --help is given.');
      });
    });

    it('should be able to run tasks', () => {
      return cmd('sample', bin('example')).then(({ stdout, stderr, failure }) => {
        expect(failure).to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('OSOM');
      });
    });

    it('should report on unknown tasks', () => {
      return cmd('sample', bin('undefined')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('Task undefined is not registered');
      });
    });

    it('should report on failed tasks', () => {
      return cmd('sample', bin('broken')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('[broken] (Error) Unexpected');
      });
    });
  });

  describe('Errors', () => {
    it('should report multiple errors', () => {
      return cmd('errored', bin('up --app multiple')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('─ SINGLE_ERROR (undefined)');
        expect(stdout).to.contain('─ [up] Error');
      });
    });

    it('should report original errors', () => {
      return cmd('errored', bin('up --app original')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('⚠ SOME DETAIL INFO');
        expect(stdout).to.contain('⚠ ORIGINAL_ERROR');
      });
    });

    it('should report stack-less errors', () => {
      return cmd('errored', bin('up --app no-stack --debug')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('─ [up] NO_STACK');
      });
    });
  });

  describe('Subshell', () => {
    const TEST_JS = `${__dirname}/fixtures/test.js`;

    it('should handle custom commands', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS}`)).then(({ stdout, stderr, failure }) => {
        expect(failure).to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('DONE');
        expect(stdout).to.contain('OSOM');
      });
    });

    it('should handle missed-rejections', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS} throw`)).then(({ stdout, stderr, failure }) => {
        expect(failure).to.be.null;
        expect(stderr).to.include('Error: UNHANDLED_REJECTION');
      });
    });

    it('should handle SIGINT-calls', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS} wait`), true).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.eql('');
      });
    });

    it('should trap errors', () => {
      return cmd('sample', bin(`example -- node ${TEST_JS} error`)).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.contain('FAILED');
        expect(stdout.split('\n').length).to.eql(2);
      });
    });
  });

  describe('Application', () => {
    it('should fail if --app is not found', () => {
      return cmd('sample', bin('up')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('Missing application script');
      });
    });

    it('should fail if --app is empty', () => {
      return cmd('app', bin('up')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('[up] (TypeError) serverFactory is not a function');
      });
    });

    it('should fail if --app is broken', () => {
      return cmd('app', bin('up --app broken')).then(({ stdout, stderr, failure }) => {
        expect(failure).not.to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain("[up] (TypeError) Cannot read property 'listen' of undefined");
      });
    });

    it('should allow custom --app', () => {
      return cmd('app', bin('up --app working')).then(({ stdout, stderr, failure }) => {
        expect(failure).to.be.null;
        expect(stderr).to.eql('');
        expect(stdout).to.contain('WORKING...');
        expect(stdout).to.contain('LISTENING...');
      });
    });
  });
});
