module.exports = (haki) => {
  // this could be used for running other tasks like migrations?
  // h gen migrate:latest
  // h gen migrate:make name=some_osom_migration
  // h gen seed:make name=add_some_values
  // h gen seed:run

  haki.setGenerator('seed:make', {
    prompts: [{
      name: 'name',
      message: 'Migration name:',
    }],
    actions: [
      (name) => {
        console.log('MAKE', name);
      },
    ],
  });

  haki.setGenerator('test', {
    basePath: __dirname,
    prompts: [{
      name: 'name',
      message: 'What is your name?',
      validate(value) {
        if (value.length > 0) {
          return true;
        }

        return 'Please anwser with your name!';
      },
    }, {
      name: 'test',
      type: 'rawlist',
      caption: 'Below are listed bla blah...',
      choices: ['foo', 'bar'],
      message: 'Choose an option:',
    }],
    actions(input) {
      if (input.test === 'bar') {
        return [{
          type: 'add',
          destFile: 'folder/{{name}}.txt',
          templateFile: 'templates/temp.txt',
        }];
      }

      console.log('DO!');
    },
  });
};
