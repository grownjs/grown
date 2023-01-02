import createContainer from '@grown/bud';

const Grown = createContainer();

Grown.use(import('@grown/server'));
Grown.use(import('@grown/router'));

Grown.ready(function main() {
  const app = new Grown();

  app.plug(Grown.Router);
  app.get('/', 'Some#handler');
  console.log(app.router.mappings.root.url());
});
