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
    {bin} generate db/models/provider.js User
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

  --esm    Optional. Ensure generated code as ESM, default is CommonJS
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

  Other modules can be created if the first argument is a filepath, e.g.

    \`db/handlers/provider.js User value:path.to.result Other:Models.get! getAPI:Services.API\`

  The arguments above generates the following code:

    module.exports = {
      getUser() {},
      value() { return this.path.to.result; },
      getOther() { return this.Models.get('Other'); },
      getAPI() { return this.Services.API; },
    };

`;

module.exports = {
  description: USAGE_INFO,
  configure(Grown) {
    Grown.CLI.define('generate:model', MODEL_GENERATOR, ({ use, args, files }) => {
      const mod = Grown.argv.flags.esm ? 'export default' : 'module.exports =';

      if (Grown.argv.flags.ts) {
        files.push([`${use}/index.ts`, "export {\n  $schema: './schema.json',\n};"]);
      } else {
        files.push([`${use}/index.js`, `${mod} {\n  $schema: './schema.json',\n};`]);
      }

      let data = {};
      /* istanbul ignore else */
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
        } else if (target.includes(':')) {
          target.split(':').forEach(prop => {
            if (!memo[cur]) {
              memo[cur] = { type: prop };
            } else {
              memo[cur][prop] = true;
            }
          });
        } else {
          memo[cur] = target ? { type: target } : undefined;
        }
        return memo;
      }, {});

      const opts = args.reduce((memo, key) => {
        memo[key] = true;
        return memo;
      }, Grown.argv.data);

      files.push([`${use}/schema.json`, JSON.stringify({
        id: path.basename(use),
        type: 'object',
        options: { ...data.options, ...opts },
        properties: { ...data.properties, ...props },
      }, null, 2)]);
    });

    Grown.CLI.define('generate:type', TYPE_GENERATOR, ({ use, args, files }) => {
      const def = Grown.CLI._.parse(use);
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

      /* istanbul ignore else */
      if (!def.ok || !def.target.id) {
        def.target.id = def.key;
      }

      /* istanbul ignore else */
      if (def.target.definitions && def.target.definitions[id] && !Grown.argv.flags.force) {
        throw new TypeError(`Definition for '${id}' already exists`);
      }

      def.target.definitions = def.target.definitions || {};
      def.target.definitions[id] = { ...def.target.definitions[id], ...schema };

      files.push([`${use}#/definitions/${id}`, def.serialize(), true]);
    });

    Grown.CLI.define('generate:def', DEF_GENERATOR, ({ use, args, files }) => {
      const mod = Grown.argv.flags.esm ? 'export default' : 'module.exports =';

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
          files.push([path.join(use, `${methodPath}/index.js`), `${mod} (${deps}) => ${prefix}function ${methodName}(${argv}) {${body}};`]);
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

    /* istanbul ignore else */
    if (Grown.argv.flags.undo) {
      const rmFiles = backup.pop();

      if (!rmFiles) {
        Grown.CLI._.status('error', 'No changes found');
      } else {
        const [date, ...files] = rmFiles.split('\t');

        files.forEach(srcFile => {
          const [target, key] = srcFile.split('#/');

          /* istanbul ignore else */
          if ((Date.now() - date) > 900000 && !Grown.argv.flags.force) {
            Grown.CLI._.status('yellow', 'skip', target);
            return;
          }

          /* istanbul ignore else */
          if (srcFile.includes('#/') && (target.includes('.js') || target.includes('.ts'))) {
            /* istanbul ignore else */
            if (key) {
              const keys = key.split('/');
              const script = keys.reduce((code, prop) => {
                code = code.replace(new RegExp(` *${prop}\\b[^]*?;\\s*\\},\\n`), '');
                return code;
              }, fs.readFileSync(target).toString());

              Grown.CLI._.write(target, script)
                .printf('\r{% yellow drop %} {% gray. %s %}\n', keys.join(', '));
            }
            return;
          }

          if (!key) {
            if (fs.existsSync(target)) {
              Grown.CLI._.remove(target);
            } else {
              Grown.CLI._.status('yellow', 'skip', target);
            }
          } else {
            const def = Grown.CLI._.parse(target);

            def.remove(key);
            Grown.CLI._.write(target, def.serialize())
              .printf('\r{% yellow drop %} {% gray. #/%s %}\n', key);
          }
        });

        fs.outputFileSync(histLog, backup.join('\n'));
      }
      return;
    }

    const [, kind, use, ...args] = Grown.argv._;
    const tasks = Grown.CLI.subtasks('generate');
    const files = [];

    /* istanbul ignore else */
    if (kind === 'def' && (use.includes('/') && use.includes('.'))) {
      const ts = use.includes('.ts');
      const obj = { ...Grown.argv.params };

      let script = fs.existsSync(use)
        ? fs.readFileSync(use).toString()
        : `${ts || Grown.argv.flags.esm ? 'export default' : 'module.exports ='} {\n};\n`;

      args.forEach(prop => {
        obj[prop] = null;
      });

      const props = Object.keys(obj).reduce((memo, key) => {
        let value = obj[key];
        /* istanbul ignore else */
        if (value && value.substr(-1) === '!') value = `${value.replace('!', '')}('${key}')`;
        /* istanbul ignore else */
        if (key.charCodeAt() >= 65 && key.charCodeAt() <= 90) key = `get${key}`;
        /* istanbul ignore else */
        if (value === '') {
          script = script.replace(new RegExp(` *${key}\\b[^]*?;\\s*\\},\\n`), '');
          return memo;
        }
        memo.push([key, `  ${key}()`, value && ` return this.${value}; `]);
        return memo;
      }, []);

      const chunk = props
        .filter(prop => {
          /* istanbul ignore else */
          if (script.includes(prop[1])) return false;
          return true;
        })
        .map(prop => `${prop[1]} {${prop[2] || ''}},`).join('\n');

      script = script.replace(/(?:module.exports\s*=|export\s+default)\s*\{\s*\n/, _ => [_.trim(), '\n', chunk ? `${chunk}\n` : ''].join(''));

      files.push([`${use}#/${props.map(([key]) => key).join('/')}`, script.trim(), true]);
    } else {
      /* istanbul ignore else */
      if (!tasks || !(kind in tasks)) {
        throw new TypeError(`${kind ? `Unknown '${kind}' generator` : 'Missing generator'}, add --help for usage info`);
      }

      /* istanbul ignore else */
      if (!use || typeof use !== 'string') {
        throw new Error(`Missing PATH to write, given '${use || ''}'`);
      }

      await tasks[kind].callback({ use, args, files });
    }

    files.forEach(([destFile, contents, definition]) => {
      const [target, key] = destFile.split('#/');

      /* istanbul ignore else */
      if (fs.existsSync(target) && !Grown.argv.flags.force && !definition) {
        throw new Error(`File ${target} already exists`);
      }

      if (!key && destFile.includes('#/')) {
        Grown.CLI._.status('yellow', 'skip', target);
      } else {
        Grown.CLI._.write(target, `${contents}\n`);
      }
    });

    let tmpFiles = files.slice();
    backup.forEach(line => {
      const tmpLines = line.split('\t').slice(1);

      tmpFiles = tmpFiles.filter(f => !tmpLines.includes(f[0]));
    });

    /* istanbul ignore else */
    if (tmpFiles.length) {
      fs.outputFileSync(histLog, `${backup.join('\n')}\n${Date.now()}\t${tmpFiles.map(x => x[0]).join('\t')}`.trim());
    }
  },
};
