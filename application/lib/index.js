const path = require('path');

const Shopfish = require('grown')();

const GRPC = Shopfish.use(require('@grown/grpc'));
const Models = Shopfish.use(require('./models'));

Shopfish('GRPC.Gateway', {
  include: [
    GRPC.Loader.scan(path.join(__dirname, '../api/schema/generated/index.proto')),
  ],
});

Shopfish('Services', {
  include: [
    GRPC.Gateway.setup(Shopfish.load(path.join(__dirname, '../api/handlers')), { timeout: 10 }),
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

module.exports = Shopfish;
