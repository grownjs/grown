'use strict';

/* eslint-disable global-require */

const cwd = process.cwd();

const _ = require('./_util');
const path = require('path');
const color = require('cli-color');
const thisPkg = require('../../package.json');

const _name = color.green(`${thisPkg.name} v${thisPkg.version}`);
const _node = color.blackBright(`node ${process.version}`);
const _desc = color.blackBright('- loading available generators...');

_.echo(`${_name} ${_node} ${_desc}\n`);

const args = process.argv.slice(3);

const nodePlop = require('node-plop');

const plop = nodePlop(require.resolve('./_plopfile'), {
  destBasePath: cwd,
});

const reQuotes = /^(.+?)=(.+?)$/g;

// translate quoted values
// FIXME?
const data = _.requestParams(process.argv.slice(4)
  .map((x) => {
    return x.indexOf(' ') === -1 ? x : x.replace(reQuotes, '$1="$2"');
  }).join('\n'));

function _runGen(cmd) {
  const gen = plop.getGenerator(cmd);

  const provided = Object.keys(data.body);
  const required = gen.prompts.map(p => p.name);

  if (provided.length) {
    required.forEach((prop) => {
      if (provided.indexOf(prop) === -1) {
        throw new Error(`Missing required '${prop}' value`);
      }
    });
  }

  const promise = provided.length
    ? gen.runActions(data.body)
    : gen.runPrompts().then(gen.runActions);

  promise.then((result) => {
    result.changes.forEach((e) => {
      const file = path.relative(cwd, e.path);

      _.echo(color.green(e.type), ' ', color.yellow(file), '\n');
    });

    result.failures.forEach((e) => {
      const file = path.relative(cwd, e.path);

      _.echo(color.red(e.type), ' ', color.yellow(file), ' ', color.red(e.error), '\n');
    });
  });
}

function _showGens() {
  const _plop = nodePlop();

  const generator = _plop.setGenerator('choose', {
    prompts: [{
      type: 'list',
      name: 'generator',
      message: 'Please choose a generator:',
      choices: plop.getGeneratorList().map((p) => {
        return {
          name: `${p.name} ${color.blackBright(p.description ? p.description : '')}`,
          value: p.name,
        };
      }),
    }],
  });

  return generator.runPrompts()
    .then(results => _runGen(results.generator));
}

if (!args.length) {
  _showGens();
} else {
  _runGen(args.shift());
}
