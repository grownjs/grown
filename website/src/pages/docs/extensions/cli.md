---
title: CLI
next:
  label: Extensions &rangle; Conn
  link: docs/extensions/conn
$render: ~/src/lib/layouts/default.pug
---

It enables a simple DSL to configure command-line tasks, i.e. manage your database setup, start or interact with your application, etc.

```js
// require and create a Grown-container
const Grown = require('@grown/bud')();

// register extension
Grown.use(require('@grown/cli'));

fixture`./tasks/example.js
  module.exports = {
    description: 'Example task',
    callback() {
      console.log('It works.')
    },
  };
`;

// overload definition
Grown('CLI', {
  task_folders: [
    __dirname + '/tasks',
  ],
});

// e.g. `node script.js example -- ls tasks`
Grown.argv._ = ['example'];
Grown.argv.raw = ['ls', 'tasks'];

// take the first non-param value
const taskName = Grown.argv._.shift();

// invoke raw args and then run
await Grown.CLI.start(taskName);

// these tasks are invoked synchronously
await Grown.CLI.run(taskName);
```

> Click <kbd>▷ RUN</kbd> on the code-block to see what happens &mdash; use this technique if you want to define your own `CLI` behavior, etc.

---

## How it works?

Task files are defined as modules, e.g. `tasks/words.js`

```js
const USAGE_INFO = `

  It will print messages

  Given any arguments, this task will print them
  back as they were received, or reversed, etc.

  --mirror   Invert whole output before print
  --reverse  Invert words before print

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

Now you can invoke this task using `grown words` or `node script.js words` depending on your installation.

Formatting for task descriptions is enouraged to have its body indented with two spaces, to help readability.

See: [built-in tasks](https://github.com/grownjs/grown/tree/master/packages/cli/bin/tasks) from the CLI module.

---

### Public methods <var>static</var>

- `start([taskName])` &mdash; Invoke a single task by name, otherwise it'll list them all.
  Additional args after `--` are executed as a shell command, returns a promise.
- `run(taskName)` &mdash; Invoke a single task by name, returns the task's `callback` result.

### Private* props <var>static</var>

- `_` &mdash; Utility helpers to deal with simple `status()`, `write()`/`remove()` files and to `parse()` data sources. Parsed data contains: `ok`, `key`, `yaml`, `target`, `remove()` and `serialize()`.
- `_start` &mdash; Initialization date, e.g. `new Date()`.
- `_tasks` &mdash; Collected tasks by name.

### Private* methods <var>static</var>

- `_findAvailableTasks()` &mdash; Scan and register file tasks once.
- `_findApplication()` &mdash; Scan for a initialization script.
- `_collectTasks(...fromDirs)` &mdash; Scan and return file tasks from given directories.
- `_showTasks([taskName])` &mdash; Test and `run` if the given `taskName` is registered. Returns a promise if it exists.
- `_showHelp([taskName])` &mdash; Display the usage info for a the given `taskName`.
- `_onError(errObj)` &mdash; Default error handler.
- `_onExit(statusCode)` &mdash; Default exit handler.
- `_exec(argv[, callback])` &mdash; Invoke a shell command from the given `argv`, then `callback` when finished.
