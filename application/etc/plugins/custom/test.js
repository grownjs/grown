const path = require('path');
const Shopfish = require('../..');

const db = Shopfish.Model.DB.bundle({
  models: path.join(__dirname, 'api/schema/models'),
  database: {
    refs: require('~/api/schema/generated'),
    identifier: 'test',
    config: {
      logging: false,
      dialect: 'sqlite',
      storage: ':memory:',
    },
  },
});

async function main() {
  await db.connect();
  await db.sync();
  await db.get('Test').create({ label: 'Foo' });

  const c = await db.get('Test').count();
  const d = await db.get('Test').findOne();

  console.log(c);
  console.log(d.get());

  await db.disconnect();
}
main();
