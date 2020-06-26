const path = require('path');

const Shopfish = require('grown')();

const GRPC = Shopfish.use(require('@grown/grpc'));
const Models = Shopfish.use(require('../apps/default/api/models'));

Shopfish('ApplicationServer', {
  getServer() {
    return require('./server')(Shopfish, require('./shared'));
  },
});

Shopfish('GRPC.Gateway', {
  include: [
    GRPC.Loader.scan(path.join(Shopfish.cwd, 'etc/schema/generated/index.proto')),
  ],
});

Shopfish('Services', {
  include: [
    GRPC.Gateway.setup(Shopfish.load(path.join(Shopfish.cwd, 'apps/default/api/handlers')), { timeout: 10 }),
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
