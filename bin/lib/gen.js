'use strict';

/* eslint-disable global-require */

const _ = require('./_util');
const color = require('cli-color');
const thisPkg = require('../../package.json');

const _name = color.green(`${thisPkg.name} v${thisPkg.version}`);
const _node = color.blackBright(`node ${process.version}`);
const _desc = color.blackBright('- loading available generators...');

_.echo(`${_name} ${_node} ${_desc}\n`);

const args = process.argv.slice(3);

const nodePlop = require('node-plop');

const plop = nodePlop(require.resolve('./_plopfile'), {
  destBasePath: process.cwd(),
});

function _runGen(cmd) {
  const gen = plop.getGenerator(cmd);

  gen.runPrompts().then(gen.runActions)
  .then((result) => {
    console.log('>>>', result);
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
