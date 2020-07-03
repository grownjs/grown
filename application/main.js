if (require.main === module) {
  require('logro').setForbiddenFields(require('./lib/forbidden'));
  require('grown/framework').main(__dirname);
}
