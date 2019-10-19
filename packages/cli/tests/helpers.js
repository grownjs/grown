const { exec } = require('child_process');
const path = require('path');

const _close = process.version.split('.')[1] === '6' ? 'exit' : 'close';

const cmd = (cwd, argv, sigkill) => new Promise(next => {
  const execCommand = {
    stdout: '',
    stderr: '',
    exitStatus: null,
  };

  const child = exec(argv, { cwd: path.join(__dirname, `fixtures/${cwd}`) }, (error, out, err) => {
    execCommand.failure = error || null;
    execCommand.stdout += out;
    execCommand.stderr += err;

    if ((error != null ? error.code : undefined) != null) {
      execCommand.exitStatus = error.code;
    }

    next(execCommand);
  });

  child.on(_close, code => {
    execCommand.exitStatus = code;
  });

  if (sigkill) setTimeout(() => child.kill('SIGINT'), 250);
});

const bin = argv => ['node', path.join(__dirname, 'fixtures/cli.js')].concat(argv || []).join(' ');

module.exports = {
  cmd,
  bin,
};
