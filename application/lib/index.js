const path = require('path');

const App = require('grown')();

const GRPC = App.use(require('@grown/grpc'));
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
    const [name, id] = ref.split('.');

    return Models.get(name).getSchema(id);
  },
  getMailer() {
    return require('./mailer');
  },
  getModel(name) {
    return Models.get(name);
  },
});

module.exports = App;
