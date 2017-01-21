const path = require('path');

module.exports = (plop) => {
  plop.setGenerator('test', {
    description: 'this is a test',
    prompts: [{
      type: 'input',
      name: 'name',
      message: 'What is your name?',
      validate(value) {
        if ((/.+/).test(value)) { return true; }
        return 'name is required';
      },
    }],
    actions: [{
      type: 'add',
      path: path.join(process.cwd(), 'folder/{{dashCase name}}.txt'),
      templateFile: path.join(__dirname, 'templates/temp.txt'),
    }],
  });
};
