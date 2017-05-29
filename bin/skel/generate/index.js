const CONTROLLER_TEMPLATE = `/* {{controllerName}} */
module.exports = {
  methods: {
    index() {},
  },
};
`;

module.exports = haki => {
  haki.setGenerator('controller', {
    description: 'Add a new controller',
    arguments: ['controllerName'],
    usage: 'It would generate a controller, route and views',
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
