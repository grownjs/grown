module.exports = (haki) => {
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
