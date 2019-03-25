const path = require('path');
const Mailor = require('mailor');

module.exports = Mailor.buildMailer(path.join(__dirname, 'generated'), {
  maildev: ['test', 'development'].includes(process.env.NODE_ENV) || process.env.MAILDEV === 'YES',
});
