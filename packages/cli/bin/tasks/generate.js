'use strict';

/* istanbul ignore file */

const fs = require('fs-extra');
const path = require('path');

const USAGE_INFO = `

  Generate arbitrary sources files

  --force  Optional. Recreate output even if already exists
  --undo   Optional. Remove files that were previously generated
  --ts     Optional. Use TypeScript syntax on the generated definitions

  Hooks:
    __HOOKS__

  Examples:
    {bin} generate model db/models/User email:string permissions:Permission[] --ts
    {bin} generate def tests/fixtures/models/Foo classMethods.{callMe,mayBe}
    {bin} generate --undo

`;

const MODEL_GENERATOR = `

  Writes a model definition from key:type fields

`;

const DEF_GENERATOR = `

  Writes a module definition from the given methods

`;

module.exports = {
  description: USAGE_INFO,
  configure(Grown) {
    Grown.CLI.define('generate:model', MODEL_GENERATOR, ({ use, files }) => {
      if (Grown.argv.flags.ts) {
        files.push([`${use}/index.ts`, "export {\n  $schema: require('./schema.json'),\n};"]);
      } else {
        files.push([`${use}/index.js`, "module.exports = {\n  $schema: require('./schema.json'),\n};"]);
      }

      files.push([`${use}/schema.json`, JSON.stringify({
        id: path.basename(use),
        type: 'object',
        properties: Object.keys(Grown.argv.params).reduce((memo, cur) => {
          const target = Grown.argv.params[cur].replace('[]', '');
          const array = Grown.argv.params[cur].substr(-2) === '[]';

          if (/^[A-Z]/.test(target)) {
            if (array) {
              memo[cur] = { type: 'array', items: { $ref: target } };
            } else {
              memo[cur] = { $ref: target };
            }
          } else {
            memo[cur] = { type: target };
          }
          return memo;
        }, {}),
      }, null, 2)]);
    });
    Grown.CLI.define('generate:def', DEF_GENERATOR, ({ use, args, files }) => {
      args.forEach(fn => {
        const body = '\n  // TODO\n';
        const methodPath = fn.replace(/[.]/g, '/');
        const methodName = path.basename(methodPath);

        if (Grown.argv.flags.ts) {
          files.push([path.join(use, `${methodPath}/index.ts`), [
            `declare function ${methodName}(): void;`,
            `export type { ${methodName} };\n`,
            `export default (): typeof ${methodName} => function ${methodName}() {${body}};`,
          ].join('\n')]);
        } else {
          files.push([path.join(use, `${methodPath}/index.js`), `module.exports = () => function ${methodName}() {${body}};`]);
        }
      });
    });
  },
  async callback(Grown) {
    const histLog = path.join(Grown.cwd, 'logs/generated.log');
    const backup = fs.existsSync(histLog) ? fs.readFileSync(histLog).toString().trim().split('\n') : [];

    if (Grown.argv.flags.undo) {
      const rmFiles = backup.pop();

      if (!rmFiles) {
        Grown.Logger.getLogger()
          .printf('\r{% error. No more files to remove %}\n');
      } else {
        rmFiles.split(' ').forEach(file => {
          fs.removeSync(file);

          let curDir = path.dirname(file);
          while (!fs.readdirSync(curDir).length) {
            fs.rmdirSync(curDir);
            curDir = path.dirname(curDir);
            if (curDir.charAt() === '.') break;
          }

          Grown.Logger.getLogger()
            .printf('\r{% info. remove %} %s\n', file);
        });

        fs.outputFileSync(histLog, backup.join('\n'));
      }
      return;
    }

    const [, kind, use, ...args] = Grown.argv._;
    const tasks = Grown.CLI.subtasks('generate');
    const files = [];

    if (!tasks || !(kind in tasks)) {
      throw new TypeError(`${kind ? `Unknown '${kind}' generator` : 'Missing generator'}, add --help for usage info`);
    }

    /* istanbul ignore else */
    if (!use || typeof use !== 'string') {
      throw new Error(`Missing PATH to write, given '${use || ''}'`);
    }

    await tasks[kind].callback({ use, args, files });

    files.forEach(([destFile, contents]) => {
      if (fs.existsSync(destFile) && !Grown.argv.flags.force) {
        throw new Error(`File ${destFile} already exists`);
      }

      fs.outputFileSync(destFile, `${contents}\n`);
      Grown.Logger.getLogger()
        .printf('\r{% info. %s %} %s\n', kind, destFile);
    });

    if (files[0] && !files[0].includes('index.d.ts')) {
      const tmpFiles = files.map(x => x[0]).join(' ');
      const offset = backup.indexOf(tmpFiles);

      if (offset >= 0) {
        backup.splice(offset, 1);
      }

      fs.outputFileSync(histLog, `${backup.join('\n')}\n${tmpFiles}`.trim());
    }
  },
};
