const CONTROLLER_TEMPLATE = `/* {{controllerName}} */
module.exports = {
  methods: {
    index() {},
  },
};
`;

const TARIMA_SCRIPTS_TEMPLATE = `"dev": "tarima -w --server",
    "build": "tarima -fq",
    "build:ci": "tarima -fqe ci",
    "build:prod": "tarima -fqe production",
    "build:stage": "tarima -fqe staging",`;

const TARIMA_CONFIG_TEMPLATE = `"tarima": {
    "src": "src/**/*",
    "ignoreFiles": [
      ".gitignore"
    ],
    "devPlugins": [
      "tarima-lr"
    ],
    "bundleOptions": {
      "bundleCache": true,
      "entryCache": true,
      "extensions": {
        "js": "es6",
        "css": "less"
      }
    }
  },`;

module.exports = haki => {
  haki.setGenerator('tarima:config', {
    actions: [{
      type: 'modify',
      unless: '"tarima":',
      pattern: '"dependencies":',
      destPath: 'package.json',
      template: `${TARIMA_CONFIG_TEMPLATE}\n  $&`,
    }],
  });

  haki.setGenerator('tarima:tasks', {
    actions: [{
      type: 'modify',
      unless: '"dev":',
      pattern: '"scripts":\\s*\\{',
      destPath: 'package.json',
      template: `$&\n    ${TARIMA_SCRIPTS_TEMPLATE}`,
    }],
  });

  haki.setGenerator('controller', {
    arguments: ['controllerName'],
    prompts: [{
      name: 'controllerName',
      message: 'Controller name',
      validate: value => value.length > 0 || "Don't forget name your controller",
    }],
    actions: [{
      type: 'add',
      template: CONTROLLER_TEMPLATE,
      destPath: 'app/controllers/{{paramCase controllerName}}.js',
    }],
  });

  haki.setGenerator('action', {
    arguments: ['controllerName', 'actionName'],
    prompts: [{
      name: 'controllerName',
      message: 'Controller name',
      validate: value => value.length > 0 || "Don't forget name your controller",
    }, {
      name: 'actionName',
      message: 'Action name',
      validate: value => value.length > 0 || "Don't forget name your action",
    }],
    actions: [{
      type: 'modify',
      unless: '{{snakeCase actionName}}(',
      pattern: 'methods\\s*:\\s*\\{',
      template: '$&\n    {{snakeCase actionName}}() {},',
      destPath: 'app/controllers/{{paramCase controllerName}}.js',
    }],
  });
};
