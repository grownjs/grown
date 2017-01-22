module.exports = (haki) => {
  haki.setGenerator('test', {
    basePath: __dirname,
    title: 'OSOM generator',
    description: 'this is a test',
    prompts: [{
      type: 'prompt',
      name: 'name',
      message: 'What is your name?',
      validate: (value) => {
        if (!value.length) {
          throw new Error('Please provide a name');
        }
      },
    }, {
      name: 'test',
      type: 'choose',
      caption: 'Below are listed bla blah...',
      options: ['foo', 'bar'],
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
    },
  });
};
