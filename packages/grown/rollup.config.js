const pkg = require('./package.json');

module.exports = [
  {
    input: 'src/index.js',
    external: ['debug'],
    output: [
      { file: pkg.main, format: 'iife' },
      { file: pkg.module, format: 'es' },
    ]
  }
];
