const fs = require('fs');
const path = require('path');
const Application = require('@grown/bud')();

const GRPC = Application.use(require('@grown/grpc'));
const Models = Application.use(require('./models'));

const mailerInstance = require('./mailer');

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
    return mailerInstance;
  },
});

module.exports = {
  Application,
  Models,
};
