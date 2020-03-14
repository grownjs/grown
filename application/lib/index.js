const path = require('path');

const App = require('grown')();

const GRPC = App.use(require('@grown/grpc'));
const Schema = App.use(require('@grown/schema'));
const Models = App.use(require('./models'));

App('GRPC.Gateway', {
  include: [
    GRPC.Loader.scan(path.join(__dirname, '../api/schema/generated/index.proto')),
  ],
});

App('Services', {
  include: [
    GRPC.Gateway.setup(App.load(path.join(__dirname, '../api/handlers')), { timeout: 10 }),
  ],
  getSchema(ref) {
    return Schema.get(ref, require('../api/schema/generated'));
  },
  getMailer() {
    return require('./mailer');
  },
  getModel(name) {
    return Models.get(name);
  },
});

module.exports = App;
