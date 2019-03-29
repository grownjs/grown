const path = require('path');
const Application = require('grown')();

const GRPC = Application.use(require('@grown/grpc'));
const Models = Application.use(require('./models'));

Application('GRPC.Gateway', {
  include: [
    GRPC.Loader.scan(path.join(__dirname, '../api/schema/generated/index.proto')),
  ],
});

Application('Services', {
  include: [
    GRPC.Gateway.setup(Application.load(path.join(__dirname, '../api/handlers'))),
  ],
  getMailer() {
    return require('./mailer');
  },
});

module.exports = {
  Application,
  Models,
};
