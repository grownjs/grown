const path = require('path');

const Shopfish = require('grown')();
const GRPC = Shopfish.use(require('@grown/grpc'));

let sites;
const { Sites } = require('./shared');

Shopfish('ApplicationServer', {
  getServer() {
    return require('./server')(Shopfish);
  },
  getSites() {
    return sites || (sites = new Sites(path.join(Shopfish.cwd, 'apps'))); // eslint-disable-line
  },
  start() {
    return Promise.all(Shopfish.ApplicationServer.getSites().find('models').map(x => Shopfish.use(require(x)).connect()));
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
  getMailer() {
    return require('./mailer');
  },
});

module.exports = Shopfish;
