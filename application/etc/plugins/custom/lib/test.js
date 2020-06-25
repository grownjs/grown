// this can be consume within the plugin impl, just matter of requiring it...
// also, it can work in standalone mode, so user can access this database from outside?
// in the case the plugin exposes and api, or just expose their models to the whole system?

module.exports = async Shopfish => {
  const db = require('../api/models')(Shopfish);

  await db.connect();
  await db.sync();
  await db.get('Test').create({ label: 'Foo' });

  const c = await db.get('Test').count();
  const d = await db.get('Test').findOne();

  console.log(c);
  console.log(d.get());

  await db.disconnect();
};
