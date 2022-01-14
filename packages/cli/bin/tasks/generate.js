'use strict';

/* istanbul ignore file */

const fs = require('fs-extra');
const path = require('path');

const USAGE_INFO = `

  Generate arbitrary source files

  --force  Optional. Recreate output even if already exists
  --undo   Optional. Remove files that were previously generated
  --ts     Optional. Use TypeScript syntax on the generated definitions

  Hooks:
    __HOOKS__

  Examples:
    {bin} generate model db/models/User email:string permissions:Permission[] --ts
    {bin} generate type app/schema/types/dataTypes.yml primaryKey type:integer
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

  Similar to models, you can declare associations and scalar types but
  you can also use more keywords, like format, minimum/maximum:

    \`type:integer minimum:0 primaryKey autoIncrement\`

  Single parameters with no :value are taken as booleans (true).

  The resuling model is appended to the target file as a definition,
  both YAML and JSON formats are supported, just use the appropriate extension.

`;

const DEF_GENERATOR = `

  Writes a module definition from the given methods

  --use    Optional. Declare a list of dependencies to inject
  --from   Optional. Declare a provider module to import its types
  --args   Optional. Declare the function arguments
  --async  Optional. Declare the function to be async

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

      let data = {};
      if (fs.existsSync(`${use}/schema.json`)) {
        data = fs.readJsonSync(`${use}/schema.json`);
      }

      const props = Object.keys(Grown.argv.params).reduce((memo, cur) => {
        const target = Grown.argv.params[cur].replace('[]', '');

        if (/^[A-Z]/.test(target)) {
          if (Grown.argv.params[cur].substr(-2) === '[]') {
            memo[cur] = { type: 'array', items: { $ref: target } };
          } else {
            memo[cur] = { $ref: target };
          }
        } else if (target.includes('/')) {
          memo[cur] = { $ref: target.replace('/', '#/definitions/') };
        } else {
          memo[cur] = target ? { type: target } : undefined;
        }
        return memo;
      }, {});

      files.push([`${use}/schema.json`, JSON.stringify({
        id: path.basename(use),
        type: 'object',
        properties: { ...data.properties, ...props },
      }, null, 2)]);
    });
    Grown.CLI.define('generate:type', TYPE_GENERATOR, ({ use, args, files }) => {
      const def = Grown.CLI.parse(use);
      const id = args.shift();
      const schema = {};

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
        } else if (value.includes('/')) {
          schema[key] = { $ref: value.replace('/', '#/') };
        } else {
          schema[key] = !value && value !== 0 ? undefined : value;
        }
      });

      args.forEach(key => {
        schema[key] = true;
      });

      if (!def.ok || !def.target.id) {
        def.target.id = def.key;
      }

      if (def.target.definitions && def.target.definitions[id] && !Grown.argv.flags.force) {
        throw new TypeError(`Definition for '${id}' already exists`);
      }

      def.target.definitions = def.target.definitions || {};
      def.target.definitions[id] = { ...def.target.definitions[id], ...schema };

      files.push([`${use}#/definitions/${id}`, def.serialize(), true]);
    });
    Grown.CLI.define('generate:def', DEF_GENERATOR, ({ use, args, files }) => {
      args.forEach(fn => {
        const body = '\n  // TODO\n';
        const prefix = Grown.argv.flags.async ? 'async ' : '';
        const [methodPath, returnType] = fn.replace(/[.]/g, '/').split(':');

        let methodName = path.basename(methodPath);
        methodName = methodName.replace(/^(?:new)$/, '_$&');

        let deps = Grown.argv.flags.use ? Grown.argv.flags.use.split(',') : [];
        deps = deps.length > 0 ? `{ ${deps.join(', ')} }` : '';

        let argv = Grown.argv.flags.args ? Grown.argv.flags.args.split(',') : [];
        argv = argv.length > 0 ? argv.join(', ') : '';

        if (Grown.argv.flags.ts) {
          const provider = Grown.argv.flags.from ? Grown.argv.flags.from.split(':') : false;
          const types = provider ? ': Provider' : '';
          const type = returnType || 'void';

          files.push([path.join(use, `${methodPath}/index.ts`), [
            provider ? `import type { ${provider[1] || 'default'} as Provider } from '${provider[0]}';\n` : null,
            `declare function ${methodName}(${argv}): ${Grown.argv.flags.async ? `Promise<${type}>` : type};`,
            `export type { ${methodName} };\n`,
            `export default (${deps}${types}): typeof ${methodName} => ${prefix}function ${methodName}(${argv}) {${body}};`,
          ].filter(Boolean).join('\n')]);
        } else {
          files.push([path.join(use, `${methodPath}/index.js`), `module.exports = (${deps}) => ${prefix}function ${methodName}(${argv}) {${body}};`]);
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
          const [target, key] = srcFile.split('#/');

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
            const def = Grown.CLI.parse(target);

            def.remove(key);
            fs.outputFileSync(target, def.serialize());

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
      const [target] = destFile.split('#/');

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
