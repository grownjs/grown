const path = require('path');

const Shopfish = require('grown')();
const GRPC = Shopfish.use(require('@grown/grpc'));

let repos;
let sites;
const createServer = require('./server');
const { Plug, Sites } = require('./shared');

Shopfish('ApplicationServer', {
  getServer() {
    return createServer(Shopfish, require('./shared'));
  },
  getSites() {
    return sites || (sites = new Sites(path.join(Shopfish.cwd, 'apps')));
  },
  start() {
    return Promise.all(repos.map(x => x.connect()));
  },
});

Shopfish('GRPC.Gateway', {
  include: [
    GRPC.Loader.scan(path.join(Shopfish.cwd, 'etc/schema/generated/index.proto')),
  ],
});

repos = Shopfish.ApplicationServer.getSites().find('models').map(x => Shopfish.use(require(x)));

Shopfish('Services', {
  include: [
    GRPC.Gateway.setup(Shopfish.load(Shopfish.ApplicationServer.getSites().find('handlers')), { timeout: 10 }),
  ],
  getSchema(ref) {
    const [name, id] = ref.split('.');

    return Shopfish.Models.get(name).getSchema(id);
  },
  getMailer() {
    return require('./mailer');
  },
  getModel(name) {
    return Shopfish.Models.get(name);
  },
});

module.exports = Shopfish;
