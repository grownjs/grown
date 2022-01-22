/* eslint-disable */

Grown.use(require('@grown/server'));

prefix = 'app';
server = new Grown();

process.nextTick(() => server.listen(8080));
process.stdout.write = msg => console.log(msg);

eval(`__dirname='${path.join(process.cwd(), 'app')}';`);
