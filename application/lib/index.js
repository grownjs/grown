const path = require('path');

const Shopfish = require('grown')();

const GRPC = Shopfish.use(require('@grown/grpc'));
const Models = Shopfish.use(require('../apps/default/api/models'));

let sites;
const { Sites } = require('./shared');
const createServer = require('./server');

Shopfish('ApplicationServer', {
  getServer() {
    return createServer(Shopfish, require('./shared'));
  },
  getSites() {
    return sites || (sites = new Sites(path.join(Shopfish.cwd, 'apps')));
  },
});

Shopfish('GRPC.Gateway', {
  include: [
    GRPC.Loader.scan(path.join(Shopfish.cwd, 'etc/schema/generated/index.proto')),
  ],
});

Shopfish('Services', {
  include: [
    GRPC.Gateway.setup(Shopfish.load(Shopfish.ApplicationServer.getSites().find('handlers')), { timeout: 10 }),
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
