module.exports = function configure() {
  this.opts.from.push(`${require('grown/framework').src}/apps`);
  this.opts.rename.unshift('**/framework/**:{fullpath/5}');
};
