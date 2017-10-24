'use strict';

/* eslint-disable global-require */

const util = require('../../lib/util');

const path = require('path');

const DATABASE_TEMPLATE = `module.exports = {
  development: {
    dialect: 'sqlite',
    storage: 'db_{{snakeCase APP_NAME}}_dev.sqlite',
  },{{#IS_SQLITE3}}
  production: {
    dialect: 'sqlite',
    storage: 'db_{{snakeCase APP_NAME}}_prod.sqlite',
  },{{/IS_SQLITE3}}{{^IS_SQLITE3}}
  production: {
    host: 'localhost',
    dialect: '{{DATABASE}}',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: '{{snakeCase APP_NAME}}_prod',
  },{{/IS_SQLITE3}}
};
`;

const BOWER_TEMPLATE = `{
  "name": "{{paramCase APP_NAME}}",
  "license": "MIT",
  "ignore": [
    "**/.*",
    "node_modules",
    "bower_components",
    "test",
    "tests"
  ]
}
`;

const JASMINE_TEST = `describe('The truth', () => {
  it('is truthy', () => {
    const truth = 42;

    expect(truth).toBe(42);
  });
});
`;

const MOCHA_TEST = `const expect = require('chai').expect;

${JASMINE_TEST.replace('toBe', 'to.equal')}`;

const AVA_TEST = `import test from 'ava';

test('The truth', t => {
  t.pass();
});`;

module.exports = ($, cwd, logger) => {
  let name = $._.shift();

  /* istanbul ignore else */
  if (!name) {
    throw new Error("Missing APP_PATH, it's required! (add --help for usage info)");
  }

  if (name === '.') {
    name = path.basename(cwd);
  } else {
    name = name.replace(/\W+/g, '-').toLowerCase();
    cwd = path.join(cwd, name);
  }

  $.data.TEMPLATE = $.data.TEMPLATE || $._.shift() || 'advanced';

  /* istanbul ignore else */
  if (['advanced', 'starter', 'basic', 'rad'].indexOf($.data.TEMPLATE) === -1) {
    throw new Error(`Unsupported TEMPLATE=${$.data.TEMPLATE}`);
  }

  /* istanbul ignore else */
  if ($.data.DATABASE
    && ['postgres', 'mysql', 'mssql', 'sqlite'].indexOf($.data.DATABASE) === -1) {
    throw new Error(`Unsupported DATABASE=${$.data.DATABASE}`);
  }

  /* istanbul ignore else */
  if ($.data.RELOADER
    && ['browser-sync', 'live-reload'].indexOf($.data.RELOADER) === -1) {
    throw new Error(`Unsupported RELOADER=${$.data.RELOADER}`);
  }

  /* istanbul ignore else */
  if ($.data.BUNDLER
    && ['fusebox', 'webpack', 'rollup'].indexOf($.data.BUNDLER) === -1) {
    throw new Error(`Unsupported BUNDLER=${$.data.BUNDLER}`);
  }

  /* istanbul ignore else */
  if ($.data.STYLES
    && ['less', 'sass', 'styl', 'postcss'].indexOf($.data.STYLES) === -1) {
    throw new Error(`Unsupported STYLES=${$.data.STYLES}`);
  }

  /* istanbul ignore else */
  if ($.data.TESTS
    && ['ava', 'mocha', 'jasmine-node'].indexOf($.data.TESTS) === -1) {
    throw new Error(`Unsupported TESTS=${$.data.TESTS}`);
  }

  /* istanbul ignore else */
  if ($.data.ES6
    && ['buble', 'babel', 'traceur'].indexOf($.data.ES6) === -1) {
    throw new Error(`Unsupported ES6=${$.data.ES6}`);
  }

  const Haki = require('haki');

  const haki = new Haki(cwd, util.extend({}, $.flags));

  function ask() {
    return haki.runGenerator({
      abortOnFail: true,
      prompts: [
        {
          name: 'TEMPLATE',
          type: 'list',
          message: 'Template:',
          choices: [
            { label: 'Advanced', value: 'advanced' },
            { label: 'Starter', value: 'starter' },
            { label: 'Basic', value: 'basic' },
            { label: 'RAD', value: 'rad' },
          ],
        },
        {
          name: 'DATABASE',
          type: 'list',
          message: 'Database:',
          choices: [
            { label: 'None', value: null },
            { label: 'PostgreSQL', value: 'postgres' },
            { label: 'MySQL', value: 'mysql' },
            { label: 'MSSQL', value: 'mssql' },
            { label: 'SQLite3', value: 'sqlite' },
          ],
        },
        {
          name: 'RELOADER',
          type: 'list',
          message: 'Reloader:',
          choices: [
            { label: 'None', value: null },
            { label: 'LiveReload', value: 'live-reload' },
            { label: 'BrowserSync', value: 'browser-sync' },
          ],
        },
        {
          name: 'BUNDLER',
          type: 'list',
          message: 'Bundler:',
          choices: [
            { label: 'None', value: null },
            { label: 'Rollup', value: 'rollup' },
            { label: 'Webpack', value: 'webpack' },
            { label: 'FuseBox', value: 'fusebox' },
          ],
        },
        {
          name: 'STYLES',
          type: 'list',
          message: 'Styles:',
          choices: [
            { label: 'None', value: null },
            { label: 'LESS', value: 'less' },
            { label: 'Sass', value: 'sass' },
            { label: 'Styl', value: 'styl' },
            { label: 'PostCSS', value: 'postcss' },
          ],
        },
        {
          name: 'TESTS',
          type: 'list',
          message: 'Tests:',
          choices: [
            { label: 'None', value: null },
            { label: 'AVA', value: 'ava' },
            { label: 'Mocha', value: 'mocha' },
            { label: 'Jasmine', value: 'jasmine-node' },
          ],
        },
        {
          name: 'ES6',
          type: 'list',
          message: 'Scripts:',
          choices: [
            { label: 'None', value: null },
            { label: 'Bublé', value: 'buble' },
            { label: 'Babel', value: 'babel' },
            { label: 'Traceur', value: 'traceur' },
          ],
        },
      ],
      // merge user-input
      actions: values => {
        Object.keys(values).forEach(key => {
          $.data[key] = typeof values[key] !== 'undefined'
            ? values[key]
            : $.data[key];
        });
      },
    });
  }

  const PREFIX = $.data.TEMPLATE === 'advanced'
    ? 'advanced'
    : 'starter';

  const ACTIONS = {
    bowerPackage: () => [
      // bower support?
      $.flags.bower !== false ? {
        type: 'add',
        dest: 'bower.json',
        template: BOWER_TEMPLATE,
      } : null,
    ],
    // application base
    setupSources: isAdvanced => (
      isAdvanced
        ? [{
          copy: '.',
          src: `${PREFIX}/_base`,
        },
        {
          copy: 'lib/{{snakeCase APP_NAME}}',
          src: `${PREFIX}/lib`,
        },
        {
          copy: 'lib/{{snakeCase APP_NAME}}_web',
          src: `${PREFIX}/web`,
        }]
      : [{
        copy: '.',
        src: `${PREFIX}/_base`,
      }]),
    renderTemplates: isAdvanced => [
      {
        type: 'extend',
        dest: 'package.json',
        callback(pkg, values) {
          const appName = values.snakeCase(values.APP_NAME);

          pkg.name = pkg.name || values.paramCase(values.APP_NAME);
          pkg.version = pkg.version || '0.0.0';
          pkg.private = true;

          pkg.scripts = {};
          pkg.scripts.start = 'grown up';
          pkg.scripts.debug = "grown repl -i `date +'%Y-%m-%d_%H%M'`";
          pkg.scripts.watch = `${values.RUN} dev -- -P localhost:8080 -r bin/server`;

          if (values.HAS_TESTS) {
            pkg.scripts.cover = `nyc --reporter=lcov --temp-directory tmp/.nyc ${values.RUN} test`;
            pkg.scripts['cover:up'] = 'codecov --file=coverage/lcov.info --disable=gcov -e TRAVIS_NODE_VERSION';

            if (values.IS_JASMINE) {
              pkg.scripts['dev:test'] = 'jasmine-node test --watchFolders app lib';
              pkg.scripts.test = 'jasmine-node test';
            }

            if (values.IS_MOCHA) {
              pkg.scripts['dev:test'] = '_mocha test -R spec --recursive --watch';
              pkg.scripts.test = '_mocha test -R spec --recursive';
            }

            if (values.IS_AVA) {
              pkg.scripts['dev:test'] = 'ava test --watch';
              pkg.scripts.test = 'ava test';
            }
          }

          pkg.scripts.lint = `eslint config cron bin lib${values.HAS_TESTS ? ' test' : ''}`;
          pkg.scripts.prod = 'yarn start -- -e production';
          pkg.scripts.dist = 'tarima -Ofqe production';
          pkg.scripts.dev = 'tarima -ed';

          pkg.main = `lib/${appName}/application.js`;

          pkg.tarima = {
            cwd: '.',
          };

          if (values.TEMPLATE === 'advanced') {
            pkg.tarima.src = [
              `lib/${appName}_web/views`,
              `lib/${appName}_web/assets`,
            ];

            pkg.tarima.watch = [
              `lib/${appName}/application.js`,
              `lib/${appName}/models`,
              `lib/${appName}/services`,
              `lib/${appName}/templates`,
              `lib/${appName}_web/controllers`,
              `lib/${appName}_web/middlewares`,
              `lib/${appName}_web/middlewares.js`,
              `lib/${appName}_web/policies.js`,
              `lib/${appName}_web/routes.js`,
              'config',
              '.env',
              'package.json',
            ];
          } else {
            pkg.tarima.src = [
              'src/views',
              'src/assets',
            ];

            pkg.tarima.watch = [
              'application.js',
              'models',
              'templates',
              '.env',
              'package.json',
            ];
          }

          pkg.tarima.filter = [
            '!_*',
            '!**/_*',
            '!**/_*/**',
          ];

          if (values.BUNDLER) {
            pkg.tarima.bundle = '**/{views,javascripts}/**';
          }

          if (values.RELOADER) {
            pkg.tarima.devPlugins = [
              values.IS_BROWSER_SYNC
                ? 'tarima-browser-sync'
                : 'tarima-lr',
            ];
          }

          if (values.HAS_PLUGINS) {
            pkg.tarima.plugins = [
              values.HAS_BOWER ? 'bower' : null,
              values.TEMPLATE === 'advanced' && values.HAS_TALAVERA ? 'talavera' : null,
            ].filter(x => x);

            pkg.tarima.pluginOptions = {};

            if (values.TEMPLATE === 'advanced' && values.HAS_TALAVERA) {
              pkg.tarima.pluginOptions.talavera = {
                dest: 'public/images',
              };
            }
            if (values.HAS_BOWER) {
              pkg.tarima.pluginOptions.bower = {
                bundle: true,
              };
            }

            if (values.RELOADER) {
              pkg.tarima.pluginOptions[values.IS_BROWSER_SYNC ? 'tarima.browser-sync' : 'tarima-lr'] = {
                timeout: 1000,
              };
            }
          }

          if (values.CAN_BUNDLE) {
            pkg.tarima.bundleOptions = {};

            if (values.ES6 && !values.IS_BUBLE) {
              pkg.tarima.bundleOptions.transpiler = values.ES6;
            }

            if (values.BUNDLER) {
              if (!values.IS_ROLLUP) {
                pkg.tarima.bundleOptions.bundler = values.BUNDLER;
              } else {
                pkg.tarima.bundleOptions.bundleCache = true;
                pkg.tarima.bundleOptions.entryCache = true;
                pkg.tarima.bundleOptions.rollup = {
                  plugins: [
                    'rollup-plugin-node-resolve',
                    'rollup-plugin-commonjs',
                  ],
                  'rollup-plugin-node-resolve': {
                    module: true,
                    jsnext: true,
                    main: true,
                    browser: true,
                  },
                };
              }
            }

            pkg.tarima.bundleOptions.extensions = {};

            if (values.ES6) {
              pkg.tarima.bundleOptions.extensions.js = 'es6';
            }

            if (values.IS_POSTCSS || values.CSS_LANG) {
              pkg.tarima.bundleOptions.extensions.css = !values.IS_POSTCSS
                ? values.CSS_LANG
                : 'post';
            }

            if (values.IS_BUBLE) {
              pkg.tarima.bundleOptions.buble = {
                jsx: 'h',
              };
            }

            if (values.IS_BABEL) {
              pkg.tarima.bundleOptions.babel = {
                presets: [
                  [
                    'es2015',
                    {},
                  ],
                ],
                plugins: [
                  [
                    'transform-react-jsx',
                    {
                      pragma: 'h',
                    },
                  ],
                ],
              };
            }

            if (values.IS_LESS) {
              pkg.tarima.bundleOptions.less = {
                plugins: [
                  'less-plugin-autoprefix',
                ],
              };
            }

            if (values.IS_POSTCSS) {
              pkg.tarima.bundleOptions.postcss = {
                plugins: [
                  'postcss-import',
                  'postcss-cssnext',
                ],
              };
            }
          }

          pkg.tarima.rename = [
            '**/views/**:{fullpath/2}',
            '**/assets/**:public/{fullpath/3}',
          ];

          pkg.tarima.ignore = [
            '.gitkeep',
          ];

          pkg.tarima.ignoreFiles = [
            '.gitignore',
          ];
        },
      },
      // evaluate templates
      {
        render: [
          'bin/server',
          isAdvanced
            ? 'lib/{{snakeCase APP_NAME}}/application.js'
            : 'application.js',
        ],
      },
    ],
    setupDatabase: isAdvanced => [
      // models directory
      $.data.DATABASE ? {
        type: 'add',
        dest: isAdvanced
          ? 'lib/{{snakeCase APP_NAME}}/models/.gitkeep'
          : 'models/.gitkeep',
      } : null,
      // default configuration
      $.data.DATABASE ? {
        type: 'add',
        template: DATABASE_TEMPLATE,
        dest: isAdvanced
          ? 'db/default/database.js'
          : 'database.js',
      } : null,
    ],
    setupTests: () => [
      // testing support
      $.data.TESTS ? {
        type: 'add',
        dest: 'test/.gitkeep',
      } : null,
      $.data.TESTS === 'ava' ? {
        type: 'add',
        dest: 'test/blank.test.js',
        content: AVA_TEST,
      } : null,
      $.data.TESTS === 'mocha' ? {
        type: 'add',
        dest: 'test/blank.test.js',
        content: MOCHA_TEST,
      } : null,
      $.data.TESTS === 'jasmine-node' ? {
        type: 'add',
        dest: 'test/blank.spec.js',
        content: JASMINE_TEST,
      } : null,
    ],
    setupDeps: () => [
      // framework dependencies
      {
        type: 'install',
        quiet: $.flags.verbose !== true,
        dependencies: [
          ['grown', 'route-mappings'],
          ['csurf', 'formidable', 'serve-static'],
          ['body-parser', 'cookie-parser', 'cookie-session'],
        ],
        devDependencies: [
          ['tarima', 'chokidar', 'node-notifier'],
          ['eslint', 'eslint-plugin-import', 'eslint-config-airbnb-base'],
          $.data.TEMPLATE === 'advanced' && $.flags.talavera !== false ? 'talavera' : null,
          $.data.TEMPLATE === 'advanced' && $.flags.bower !== false ? 'tarima-bower' : null,
          $.data.TEMPLATE === 'advanced' && ['csso', 'google-closure-compiler-js'],
        ],
      },
      // database dependencies
      $.data.DATABASE ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        dependencies: [
          ['sequelize', 'json-schema-sequelizer'],
          $.data.DATABASE === 'mysql' ? 'mysql' : null,
          $.data.DATABASE === 'mssql' ? 'mssql' : null,
          $.data.DATABASE === 'sqlite' ? 'sqlite3' : null,
          $.data.DATABASE === 'postgres' ? ['pg', 'pg-native'] : null,
        ],
      } : null,
      // extra dependencies
      ($.data.DATABASE || $.data.BUNDLER || $.data.STYLES || $.data.ES6) ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        devDependencies: [
          $.data.DATABASE && $.data.DATABASE !== 'sqlite' ? 'sqlite3' : null,
          $.data.BUNDLER === 'fusebox' ? 'fuse-box' : null,
          $.data.BUNDLER === 'webpack' ? 'webpack' : null,
          $.data.BUNDLER === 'rollup' ? ['rollup', 'rollup-plugin-node-resolve', 'rollup-plugin-commonjs'] : null,
          $.data.STYLES === 'less' ? ['less', 'less-plugin-autoprefix'] : null,
          $.data.STYLES === 'postcss' ? ['postcss', 'postcss-import', 'postcss-cssnext'] : null,
          $.data.STYLES === 'sass' ? 'node-sass' : null,
          $.data.STYLES === 'styl' ? 'styl' : null,
          $.data.ES6 === 'traceur' ? 'traceur' : null,
          $.data.ES6 === 'babel' ? ['babel-core', 'babel-preset-es2015', 'babel-plugin-transform-react-jsx'] : null,
          $.data.ES6 === 'buble' ? 'buble' : null,
        ],
      } : null,
      // testing dependencies
      $.data.TESTS ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        devDependencies: [
          ['nyc', 'codecov'],
          $.data.TESTS === 'jasmine-node'
            ? ['jasmine-node@2.0.0-beta4']
            : $.data.TESTS,
          $.data.TESTS === 'mocha' ? 'chai' : null,
        ],
      } : null,
      // reloader dependencies
      $.data.RELOADER ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        optionalDependencies: [
          $.data.RELOADER === 'browser-sync' ? 'tarima-browser-sync' : null,
          $.data.RELOADER === 'live-reload' ? 'tarima-lr' : null,
        ],
      } : null,
    ],
  };

  function run(template) {
    return haki.runGenerator({
      abortOnFail: true,
      basePath: path.join(__dirname, '../skel/template'),
      actions: [{
        copy: '.',
        src: '_default',
      }].concat(
        ACTIONS.bowerPackage(),
        ACTIONS.setupSources(template === 'advanced'),
        ACTIONS.renderTemplates(template === 'advanced'),
        ACTIONS.setupDatabase(template === 'advanced'),
        ACTIONS.setupTests(),
        ACTIONS.setupDeps()).filter(x => x),
    }, util.extend({
      APP_NAME: name,
      CSS_LANG: $.data.STYLES,
      CAN_BUNDLE: $.data.BUNDLER || $.data.STYLES || $.data.ES6,
      RUN: $.flags.yarn === true ? 'yarn' : 'npm run',
      IS_ADVANCED: template === 'advanced',
      IS_STARTER: template === 'starter',
      IS_BASIC: template === 'basic',
      IS_RAD: template === 'rad',
      IS_LESS: $.data.STYLES === 'less',
      IS_BUBLE: $.data.ES6 === 'buble',
      IS_BABEL: $.data.ES6 === 'babel',
      IS_ROLLUP: $.data.BUNDLER === 'rollup',
      IS_POSTCSS: $.data.STYLES === 'postcss',
      IS_SQLITE3: $.data.DATABASE === 'sqlite',
      IS_BROWSER_SYNC: $.data.RELOADER === 'browser-sync',
      HAS_PLUGINS: $.flags.bower !== false || $.flags.talavera !== false || $.data.RELOADER,
      HAS_BOWER: $.data.TEMPLATE === 'advanced' && $.flags.bower !== false,
      HAS_TALAVERA: $.data.TEMPLATE === 'advanced' && $.flags.talavera !== false,
      HAS_TESTS: $.data.TESTS,
      IS_JASMINE: $.data.TESTS === 'jasmine-node',
      IS_MOCHA: $.data.TESTS === 'mocha',
      IS_AVA: $.data.TESTS === 'ava',
    }, $.data));
  }

  if ($.data.TEMPLATE === 'basic') {
    $.data.ES6 = $.data.ES6 || 'babel';
    $.data.TESTS = $.data.TESTS || 'mocha';
    $.data.STYLES = $.data.STYLES || 'postcss';
    $.data.BUNDLER = $.data.BUNDLER || 'webpack';
    $.data.RELOADER = $.data.RELOADER || 'browser-sync';
  }

  if ($.data.TEMPLATE === 'rad') {
    $.data.ES6 = $.data.ES6 || 'buble';
    $.data.TESTS = $.data.TESTS || 'jasmine-node';
    $.data.STYLES = $.data.STYLES || 'less';
    $.data.BUNDLER = $.data.BUNDLER || 'rollup';
    $.data.RELOADER = $.data.RELOADER || 'live-reload';
  }

  ($.flags.interactive
    ? ask().then(() => run($.data.TEMPLATE))
    : run($.data.TEMPLATE))
  .catch(e => {
    util.printError(e, $.flags, logger, true);
    util.die(1);
  });
};
