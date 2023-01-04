import createContainer from '@grown/bud';
import type { Routes, Route } from './routes';

const Grown = createContainer();

Grown.use(import('@grown/server'));
Grown.use(import('@grown/router'));

Grown.ready(() => {
  const app = new Grown();

  app.plug(Grown.Router);
  app.get('/', 'Some#handler');
  app.get('/:a+:b', { as: 'page' }, 'Some#page');
  app.get('/foo/bar', { as: 'static' }, 'Some#handler');
  app.get('/*match', { as: 'nested.not_found' }, 'Some#fallback');

  const routes = app.router.mappings as Routes;
  const map = app.router.routes as Route[];

  console.log(map[0].url());
  console.log(routes.root.url());
  console.log(routes.static.url());
  console.log(routes.page.url({ a: 'x', b: 1 }));
  console.log(routes.nested.not_found.url([[1, 2, 3]]));
});
