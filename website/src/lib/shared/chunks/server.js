/* eslint-disable */

Grown.use(require('@grown/server'));

prefix = 'app';
server = new Grown();

process.nextTick(() => server.listen(8080));

eval(`__dirname='${path.join(process.cwd(), 'app')}';`);
