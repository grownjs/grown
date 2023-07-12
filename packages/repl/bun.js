/* eslint-disable no-labels, no-continue, no-loop-func, no-cond-assign, no-constant-condition, no-restricted-syntax, no-await-in-loop */

import fs from 'fs';
import path from 'path';

import { Readline } from './readline';

export default class REPL {
  constructor(options, evaluate) {
    const repl = new Readline(options.prompt, options.logFile);

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

        if (!fs.existsSync(mod)) {
          console.log(`Failed to load: ${src}`);
          return;
        }

        try {
          evaluate(fs.readFileSync(mod).toString(), context);
        } catch (e) {
          console.log(e);
        }
      }

      function handleCommand(name, input) {
        if (commands.has(name)) {
          commands.get(name).action(input);
        } else {
          console.error('Invalid REPL keyword');
        }
      }

      $: do {
        if (repl.paused) {
          await new Promise(ok => process.nextTick(ok));
          continue;
        }

        const userInput = repl.input();

        if (!userInput || userInput === 'undefined') continue;
        if (userInput.startsWith('.')) {
          const command = userInput.slice(1).split(/[ \t]+/)[0];

          switch (command) {
            case 'exit': doExit(); break;
            case 'help': showHelp(); continue $;
            case 'clear': doReset(console.clear()); continue $;
            case 'save': saveLogs(userInput.substr(command.length + 2)); continue $;
            case 'load': loadScript(userInput.substr(command.length + 2)); continue $;
            default: handleCommand(command, userInput.substr(command.length + 2)); continue $;
          }
        }

        try {
          await options.eval(userInput, context, 'bun:repl', (err, value) => {
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
      pause: () => { repl.paused = true; },
      resume: () => { repl.paused = false; },
      setPrompt: input => { repl.prompt = input; },
      displayPrompt: () => setTimeout(() => repl.input()),
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
}
