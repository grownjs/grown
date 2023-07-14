import fs from 'fs';
import RustyBun from 'rustybun';

import {
  createProxy,
  createLoader,
  createPrompter,
} from './shared';

export class Prompter extends RustyBun {
  constructor(options) {
    super();
    this.closing = false,
    this.prompt = options.prompt;
    this.#historyfd = fs.openSync(options.logFile, 'a+');
    this.#historypath = options.logFile;
    this.loadHistory(options.logFile);
  }

  input() {
    const input = this.readline(this.prompt);

    if (input.signal === 'CtrlD') {
      this.exit();
    } else if (input.signal === 'CtrlC') {
      if (this.closing) {
        this.exit();
      } else {
        console.log('(To exit, press Ctrl+C again or Ctrl+D or type .exit)');
        this.closing = true;
        return;
      }
    }

    this.closing = false;

    input.value = String(input.value).trim();

    if (input.value && input.value !== '.history') {
      fs.appendFileSync(this.#historyfd, `${input.value}\n`, 'utf8');
      this.loadHistory(this.#historypath);
    }
    return input.value || undefined;
  }

  exit(exitcode = 0) {
    fs.closeSync(this.#historyfd);
    process.exit(exitcode);
  }

  prompt;
  closing;
  #historyfd;
  #historypath;
}

export default class REPL {
  constructor(options) {
    options.eval = createProxy;
    options.load = createLoader;

    return createPrompter(new Prompter(options), options);
  }
}
