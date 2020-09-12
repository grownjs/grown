const Grown = require('@grown/bud')();

Grown.use(require('@grown/server'));

const server = new Grown();

process.nextTick(() => server.listen(8080));
process.stdout.write = msg => console.log(msg);
