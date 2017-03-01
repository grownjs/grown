module.exports = (haki) => {
  function generateApp() {
    return {
      basePath: __dirname,
      prompts: [{
        name: 'appName',
        message: 'Application name:',
        validate: value => value.length > 0 || 'Missing name?',
      }, {
        name: 'appType',
        type: 'list',
        message: 'Clean or complete stack farm:',
        choices: ['clean', 'full'],
      }],
      actions(data) {
        if (data.fail) {
          return [{
            type: 'exec',
            command: 'templates/tasks/error.js',
            destPath: 'dummy',
          }];
        }

        return [{
          type: 'copy',
          srcPath: 'templates/preset/{{appType}}',
          destPath: '{{snakeCase appName}}',
        }];
      },
    };
  }

  function tryToMake(defaults) {
    if (defaults.app === true) {
      return generateApp();
    }

    return {
      prompts: [{
        name: 'mk',
        type: 'list',
        message: 'Resource to make:',
        choices: ['app', 'model', 'controller', 'view'],
      }],
      actions(data) {
        return haki.runGenerator(`make:${data.mk}`);
      },
    };
  }

  haki.setGenerator('make', tryToMake);
  haki.setGenerator('make:app', generateApp);
};
