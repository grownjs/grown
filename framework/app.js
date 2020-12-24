const path = require('path');

module.exports = (Grown, opts) => {
  let sites;
  const { Sites } = require('./lib');

  Grown('ApplicationServer', {
    getServer() {
      return require('./server')(Grown, opts);
    },
    getSites() {
      return sites || (sites = new Sites(opts.shared_folders)); // eslint-disable-line
    },
    start() {
      return Promise.all(Grown.ApplicationServer.getSites().find('models').map(x => Grown.use(require(x)).connect()));
    },
  });

  const extensions = [];

  extensions.push(require('./http')(Grown));

  if (opts.grpc !== false) {
    const GRPC = Grown.use(require('@grown/grpc'));

    Grown('GRPC.Gateway', {
      include: [
        GRPC.Loader.scan(path.join(Grown.cwd, 'etc/schema/generated/index.proto')),
      ],
    });

    extensions.push(GRPC.Gateway.setup(Grown.load(Grown.ApplicationServer.getSites().find('handlers')), { timeout: 10 }));
  }

  let mailer;
  const Mailor = require('mailor');

  Grown('Services', {
    include: extensions,
    start() {},
    getMailer() {
      return mailer || (mailer = Mailor.buildMailer(path.join(Grown.cwd, 'etc/mailer/generated'), { // eslint-disable-line
        maildev: ['test', 'development'].includes(Grown.env) && process.env.MAILDEV === 'YES',
      }));
    },
  });

  return Grown;
};
