'use strict';

/* istanbul ignore file */

const jsyaml = require('js-yaml');
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
    {bin} generate type app/schema/types/dataTypes primaryKey type:integer minimum:0
    {bin} generate def src/App methods.main --use Auth,Session,util
    {bin} generate --undo

`;

const MODEL_GENERATOR = `

  Writes a model definition from name:type fields

  Only scalar types are supported: string, number, integer and boolean.

  - Enum values can be specified with commas, e.g. \`role:USER,ADMIN,GUEST\`
  - Arrays are set if the type ends with \`[]\`, e.g. \`keywords:string[]\`
  - Associations are set if given type is capitalized, e.g. \`tags:Tag[]\`

  ⚠ Generated models will have a \`id\` attribute defined as primaryKey.

`;

const TYPE_GENERATOR = `

  Writes a new type definition from key:value fields

  --yaml   Optional. Save the generated file as YAML if needed

  Similar to models, you can declare associations and scalar types but
  you can also use more keywords, like format, minimum/maximum:

    \`type:integer minimum:0 primaryKey autoIncrement\`

  Single parameters with no :value are taken as booleans (true).

  The resuling model is appended to the target file as a definition,
  both YAML and JSON file-types are supported.

`;

const DEF_GENERATOR = `

  Writes a module definition from the given methods

  --use   Optional. Declare a list of dependencies to inject
  --from  Optional. Declare a provider module to import its types

  When used with --ts you can declare the return types as: \`methods.main:void\`

  Injected dependencies can declare their types through a Provider type, e.g.

    \`--use User,Session --from "~/app/types:ModelsProvider"\`

  It will generate something like this:

    import type { ModelsProvider as Provider } from '~/app/types';
    export default ({ User, Session }: Provider) => function main() { ... };

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
    Grown.CLI.define('generate:type', TYPE_GENERATOR, ({ use, args, files }) => {
      let baseFile = use;
      if (!fs.existsSync(baseFile)) {
        if (fs.existsSync(`${baseFile}.yml`)) baseFile = `${baseFile}.yml`;
        if (fs.existsSync(`${baseFile}.json`)) baseFile = `${baseFile}.json`;
      }

      const schema = {};
      const id = args.shift();
      const isNew = !fs.existsSync(baseFile);
      const text = !isNew ? fs.readFileSync(baseFile).toString() : '';

      let target;
      let yaml;
      if (baseFile.includes('.yml')) {
        yaml = true;
        target = text.trim() ? jsyaml.load(text) : {};
      } else {
        target = text.trim() ? JSON.parse(text) : {};
      }

      Object.keys(Grown.argv.params).forEach(key => {
        const value = Grown.argv.params[key];

        if (/^-?\d+(?:\.\d+)?$/.test(value)) {
          schema[key] = parseFloat(value);
        } else if (/^(?:true|false|null|\[.*?\]|{.*?})$/.test(value)) {
          schema[key] = JSON.parse(value);
        } else if (/^[A-Z]/.test(value)) {
          schema[key] = value.substr(-2) === '[]'
            ? { type: 'array', items: { $ref: value.substr(0, value.length - 2) } }
            : { $ref: value };
        } else {
          schema[key] = value;
        }
      });

      args.forEach(key => {
        schema[key] = true;
      });

      if (isNew) {
        target = { id: path.basename(baseFile).replace(/\.\w+$/, ''), definitions: { [id]: schema } };
      } else {
        if (target.definitions && target.definitions[id] && !Grown.argv.flags.force) {
          throw new TypeError(`Definition for '${id}' already exists`);
        }

        target.definitions = target.definitions || {};
        target.definitions[id] = schema;
      }

      if (yaml) {
        files.push([`${baseFile}#/definitions/${id}`, jsyaml.dump(target).trim(), true]);
      } else {
        files.push([`${baseFile}#/definitions/${id}`, JSON.stringify(target, null, 2), true]);
      }
    });
    Grown.CLI.define('generate:def', DEF_GENERATOR, ({ use, args, files }) => {
      args.forEach(fn => {
        const body = '\n  // TODO\n';
        const methodPath = fn.replace(/[.]/g, '/');
        const methodName = path.basename(methodPath);

        let deps = Grown.argv.flags.use ? Grown.argv.flags.use.split(',') : [];
        deps = deps.length > 0 ? `{ ${deps.join(', ')} }` : '';

        if (Grown.argv.flags.ts) {
          const provider = Grown.argv.flags.from ? Grown.argv.flags.from.split(':') : false;
          const types = provider ? ': Provider' : '';

          files.push([path.join(use, `${methodPath}/index.ts`), [
            provider ? `import type { ${provider[1] || 'default'} as Provider } from '${provider[0]}';\n` : null,
            `declare function ${methodName}(): void;`,
            `export type { ${methodName} };\n`,
            `export default (${deps}${types}): typeof ${methodName} => function ${methodName}() {${body}};`,
          ].filter(Boolean).join('\n')]);
        } else {
          files.push([path.join(use, `${methodPath}/index.js`), `module.exports = (${deps}) => function ${methodName}() {${body}};`]);
        }
      });
    });
  },
  async callback(Grown) {
    const histLog = path.join(Grown.cwd, 'logs/generated.log');
    const backup = fs.existsSync(histLog)
      ? fs.readFileSync(histLog).toString().trim().split('\n')
        .filter(Boolean)
      : [];

    if (Grown.argv.flags.undo) {
      const rmFiles = backup.pop();

      if (!rmFiles) {
        Grown.Logger.getLogger()
          .printf('\r{% error. No changes found %}\n');
      } else {
        rmFiles.split('\t').forEach(srcFile => {
          const [target, key] = srcFile.split('#/definitions/');

          if (!key) {
            fs.removeSync(target);

            let curDir = path.dirname(target);
            while (!fs.readdirSync(curDir).length) {
              fs.rmdirSync(curDir);
              curDir = path.dirname(curDir);
              if (curDir.charAt() === '.') break;
            }

            Grown.Logger.getLogger()
              .printf('\r{% info. remove %} %s\n', target);
          } else {
            let data;
            let yaml;
            if (target.includes('.yml')) {
              yaml = true;
              data = jsyaml.load(fs.readFileSync(target).toString());
            } else {
              data = JSON.parse(fs.readFileSync(target).toString());
            }

            if (!(data && data.definitions[key])) {
              throw new Error(`Definition for '${key}' not found`);
            }

            delete data.definitions[key];

            if (yaml) {
              fs.outputFileSync(target, jsyaml.dump(data));
            } else {
              fs.outputJsonSync(target, data);
            }

            Grown.Logger.getLogger()
              .printf('\r{% info. write %} %s\n', target);
          }
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

    files.forEach(([destFile, contents, definition]) => {
      const [target] = destFile.split('#/definitions/');

      if (fs.existsSync(target) && !Grown.argv.flags.force && !definition) {
        throw new Error(`File ${target} already exists`);
      }

      fs.outputFileSync(target, `${contents}\n`);
      Grown.Logger.getLogger()
        .printf('\r{% info. %s %} %s\n', kind, target);
    });

    let tmpFiles = files.slice();
    backup.forEach(line => {
      const tmpLines = line.split('\t');

      tmpFiles = tmpFiles.filter(f => !tmpLines.includes(f[0]));
    });

    if (tmpFiles.length) {
      fs.outputFileSync(histLog, `${backup.join('\n')}\n${tmpFiles.map(x => x[0]).join('\t')}`.trim());
    }
  },
};
