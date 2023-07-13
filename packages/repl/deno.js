/* eslint-disable max-classes-per-file */

const readline = require('node:readline/promises');

const fs = require('fs');

const {
  createProxy,
  createLoader,
  createPrompter,
} = require('./shared');

class Prompter {
  constructor(options) {
    this.prompt = options.prompt;
    this.readline = readline.createInterface({
      input: options.stdin,
      output: options.stdout,
      history: fs.readFileSync(options.logFile).toString().split('\n').reverse(),
    });

    const fd = fs.openSync(options.logFile, 'a+');
    const ws = fs.createWriteStream(options.logFile, { fd });

    ws.on('error', err => {
      throw err;
    });

    this.readline.__history = ws;
    this.readline.on('close', () => {
      fs.closeSync(fd);
    });

    this.readline.__closing = false;
    this.readline.on('SIGINT', () => {
      if (this.readline.__closing) {
        this.readline.close();
      } else {
        console.log('(To exit, press Ctrl+C again or Ctrl+D or type .exit)');
        this.readline.__closing = true;
      }
    });
  }

  async input() {
    const line = await this.readline.question(this.prompt);

    this.readline.__closing = false;

    if (line && line !== '.history') {
      this.readline.__history.write(`${line}\n`);
    }

    return line;
  }
}

class REPL {
  constructor(options) {
    options.eval = createProxy;
    options.load = createLoader;

    return createPrompter(new Prompter(options), options);
  }
}

module.exports = REPL;
