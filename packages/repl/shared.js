/* eslint-disable no-labels, no-continue, no-loop-func, no-cond-assign, no-constant-condition, no-restricted-syntax, no-await-in-loop */

const fs = require('fs');
const path = require('path');

const reImports = require('rewrite-imports');
const reExports = require('rewrite-exports');

// eslint-disable-next-line func-names, no-empty-function, space-before-blocks
const AsyncFunction = async function (){}.constructor;

function createLoader(file, context) {
  const loader = 'await __loader';
  const code = fs.readFileSync(file).toString();
  const js = reImports.rewrite(reExports(code, null, loader), loader);

  const mod = { exports: {} };

  // eslint-disable-next-line no-new-func
  const fn = new AsyncFunction('module,__loader', js);
  const load = async src => { const out = await import(src); return out.default || out; };

  fn(mod, load).then(() => Object.assign(context, mod.exports));
}

async function createProxy(userInput, context, source, cb) {
  const code = userInput.replace(/(?:let|var|const)\s/g, '');
  const fn = new AsyncFunction('self', `with (self) return ${code}`);
  const ctx = new Proxy(context, {
    set: (obj, prop, value) => {
      context[prop] = value;
      obj[prop] = value;
      return true;
    },
    get: (obj, prop) => {
      return obj[prop];
    },
  });

  try {
    const result = await fn(ctx);

    cb(null, result);
  } catch (e) {
    cb(e);
  }
}

function createPrompter(prompter, options) {
  const events = new Map();
  const commands = new Map();

  let history = [];
  let context = {};
  async function loop() {
    function emit(e, arg) {
      const fn = events.get(e);

      if (fn) fn(arg);
    }

    function doReset() {
      context = {};
      emit('reset', context);
    }

    function doExit() {
      emit('exit');
    }

    function showHelp() {
      console.log('.clear     Break, and also clear the local context');
      console.log('.exit      Exit the REPL');
      console.log('.help      Print this help message');
      console.log('.load      Load JS from a file into the REPL sessions');
      console.log('.save      Save all evaluated commands in this REPL session to a file');

      commands.forEach((opts, name) => {
        console.log(`.${`${name}          `.substr(0, 10)}${opts.help}`);
      });
    }

    function saveLogs(dest) {
      try {
        fs.writeFileSync(dest, history.join('\n'));
        console.log(`Session saved to: ${dest}`);
      } catch (e) {
        console.error(`Failed to save: ${dest}`);
      }
    }

    function loadScript(src) {
      const mod = path.resolve(src);

      try {
        options.load(mod, context);
      } catch (e) {
        console.log(`Failed to load: ${src}`);
      }
    }

    async function handleCommand(name, input) {
      if (commands.has(name)) {
        await commands.get(name).action(input);
      } else {
        console.error('Invalid REPL keyword');
      }
    }

    $: do {
      if (prompter.paused) {
        await new Promise(ok => process.nextTick(ok));
        continue;
      }

      const userInput = await prompter.input();

      if (!userInput || userInput === 'undefined') continue;
      if (userInput.startsWith('.')) {
        const command = userInput.slice(1).split(/[ \t]+/)[0];

        switch (command) {
          case 'exit': doExit(); break;
          case 'help': showHelp(); continue $;
          case 'clear': doReset(console.clear()); continue $;
          case 'save': saveLogs(userInput.substr(command.length + 2)); continue $;
          case 'load': loadScript(userInput.substr(command.length + 2)); continue $;
          default: await handleCommand(command, userInput.substr(command.length + 2)); continue $;
        }
      }

      try {
        await options.eval(userInput, context, 'REPL', (err, value) => {
          if (context._error = err) {
            options.logger.info('\r{% error. %s %}\n', err.stack || err.message);
          } else {
            console.log(context._ = value);
          }
        });
      } catch (e) {
        options.logger.info('\r{% error. %s %}\n', e.stack || e.message);
      }
    } while (true);
  }

  process.nextTick(loop);

  return Object.defineProperties({
    on: (e, fn) => events.set(e, fn),
    pause: () => { prompter.paused = true; },
    resume: () => { prompter.paused = false; },
    setPrompt: input => { prompter.prompt = input; },
    displayPrompt: () => setTimeout(() => prompter.input()),
    defineCommand: (name, opts) => commands.set(name, opts),
  }, {
    context: {
      get: () => context,
    },
    history: {
      get: () => history,
      set: v => { history = v; },
    },
  });
}

module.exports = {
  createPrompter,
  createLoader,
  createProxy,
};
