---
title: CLI
$render: ../../../_/layouts/default.pug
runkit:
  preamble: |
    const fs = require('fs');
    const assert = require('assert');
    fs.mkdirSync('./tasks');
    fs.writeFileSync('./tasks/example.js',
      `module.exports = {
        description: 'Example task',
        callback() {
          console.log('It works.')
        },
      };`);
    const stripAnsi = require('strip-ansi');
    const toString = value => String(Buffer.from(value));
    const normalizeText = msg => stripAnsi(msg.replace(/[\r\n\b]/g, ''));
    process.stdout.write = msg => console.log(normalizeText(toString(msg)));
---

Manage your database setup, start or interact with your application, etc.


```js
/* @runkit */
// require and create a Grown-container
const Grown = require('@grown/bud')();

// register extension
Grown.use(require('@grown/cli'));

// overload definition
Grown('CLI', {
  task_folders: [
    `${__dirname}/tasks`,
  ],
});

// e.g. ./tasks/example.js
// module.exports = {
//   description: 'Example task',
//   callback() {
//     console.log('It works.')
//   },
// };

// e.g. `node script.js example -- ls tasks`
Grown.argv._ = ['example'];
Grown.argv.raw = ['ls', 'tasks'];

// take the first non-param value
const taskName = Grown.argv._.shift();

// invoke raw args and then run
Grown.CLI.start(taskName)
  .then(() => {
    // these tasks are invoked synchronously
    Grown.CLI.run(taskName);
  });
```

> Use this technique if you don't want to install `@grown/cli` globally, or
> if you want to overload its default behavior, etc.

---

## How it works?

Task files are defined as modules, e.g.

```js
const USAGE_INFO = `

It will print any given messages

Just the first line is used as description,
the rest is shown when --help is used.

--mirror   Invert whole output before print
--reverse  Invert words before print

(any format is allowed here)

Examples:
  node script.js example hello world

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown) {
    const words = Grown.argv._.slice();

    if (!words.length) {
      throw new Error('Missing words');
    }

    let output = words.join(' ');

    if (Grown.argv.flags.mirror) {
      output = output.split('').reverse().join('');
    }

    if (Grown.argv.flags.reverse) {
      output = words.reverse().join(' ');
    }

    Grown.Logger.message(output);
  },
};
```

See: [built-in tasks](https://github.com/pateketrueke/grown/tree/master/packages/cli/bin/tasks) from CLI module

---

### Public methods <var>static</var>

- `start([taskName])` &mdash; Invoke a single task by name, otherwise it'll list them all.
  Additional args after `--` are executed as a shell command, returns a promise.
- `run(taskName)` &mdash; Invoke a single task by name, returns the task's `callback` result.

### Private* props <var>static</var>

- `_tasks` &mdash;

### Private* methods <var>static</var>

- `_findAvailableTasks()` &mdash;
- `_findApplication()` &mdash;
- `_collectTasks(...args)` &mdash;
- `_showTasks([taskName])` &mdash;
- `_showHelp([taskName])` &mdash;
- `_onError(errObj)` &mdash;
- `_onExit(statusCode)` &mdash;
- `_exec(argv, callback)` &mdash;

---

➯ Next: [Extensions &rangle; Conn](./docs/extensions/conn)
