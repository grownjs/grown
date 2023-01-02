import type { GrownInterface, GrownUtils, Plug } from '@grown/bud';

declare module '@grown/router' {
  interface RouteMappings {
    /**
    NAMED ROUTES
    */
    mappings: UrlMap;
    routes: UrlInfo;

    namespace(path: string, group: RoutesCallback): this;
    resources(path: string, opts?: RouteOptions): this;
    resource(path: string, opts?: RouteOptions): this;

    get(path: string, handler: string): this;
    get(path: string, opts: RouteOptions, handler: string): this;

    post(path: string, handler: string): this;
    post(path: string, opts: RouteOptions, handler: string): this;

    put(path: string, handler: string): this;
    put(path: string, opts: RouteOptions, handler: string): this;

    patch(path: string, handler: string): this;
    patch(path: string, opts: RouteOptions, handler: string): this;

    delete(path: string, handler: string): this;
    delete(path: string, opts: RouteOptions, handler: string): this;
  }

  interface RoutesCallback {
    (router: RouterFactory): RouteMappings;
  }

  interface RouterFactory {
    (opts?: RouteOptions): RouteMappings;
  }

  interface ControllerInfo {
    instance: any;
    definition: any;
  }

  interface PipelineInfo {
    call: [Object, string];
    name: string;
    type: string;
  }

  type UrlParam = string | number | { [key: string]: string | number; };

  /**
  Registered routes can be accesed by alias, path or index.

  Names are set from their `as` option or from its path, e.g. `/foo/bar => foo.bar`

  Example
  ```js
  app.router.get('/:foo/bar/baz', { as: 'baz' }, 'Foo');
  app.router.get('/:buzz', 'Bar');

  app.router.mappings.baz.url({ foo: 42 });
  app.router.mappings.buzz.url();
  ```
  */
  interface UrlInfo {
    /**
    Renders URL from its template, e.g. `/:foo` will render `/42` if `{ foo: 42 }` is given.
    @param args List of values to render in the URL template, can be scalars or objects
    */
    (...args: UrlParam[]): string;
    [key: string]: UrlInfo;
    url: UrlInfo;
  }

  /**
  SOME INFO
  */
  interface UrlMap {
    /**
    FIXME MAP
    @param path Named route to render from, e.g. `foo.bar`
    @param args List of values to render in the URL template, can be scalars or objects
    */
    (path: string, ...args: UrlParam[]): UrlInfo | string;

    /**
    NAMED ROUTE
    */
    [key: string]: UrlInfo;
  }

  interface RouteOptions {
    to?: string;
    as?: string;
  }

  /**
  ROUTER CLASS
  */
  interface RouterClass extends Plug {
    Controllers: Plug;
    Mappings: Plug;
  }

  /**
  Router PLUG
  */
  interface RouterPlug extends Plug {
    Router: RouterClass;
  }
}

declare module '@grown/server' {
  interface Connection {
    /**
    Router CHECK
    */
    routes: UrlMap;
  }
}

declare module '@grown/bud' {
  interface GrownInterface {
    /**
    Router PROP
    */
    Router: RouterClass;
  }

  interface GrownInstance {
    /**
    Router PROP II
    */
    router: RouteMappings;

    namespace(path: string, group: RoutesCallback): RouteMappings;
    resources(path: string, opts?: RouteOptions): RouteMappings;
    resource(path: string, opts?: RouteOptions): RouteMappings;

    get(path: string, handler: string): RouteMappings;
    get(path: string, opts: RouteOptions, handler: string): RouteMappings;

    post(path: string, handler: string): RouteMappings;
    post(path: string, opts: RouteOptions, handler: string): RouteMappings;

    put(path: string, handler: string): RouteMappings;
    put(path: string, opts: RouteOptions, handler: string): RouteMappings;

    patch(path: string, handler: string): RouteMappings;
    patch(path: string, opts: RouteOptions, handler: string): RouteMappings;

    delete(path: string, handler: string): RouteMappings;
    delete(path: string, opts: RouteOptions, handler: string): RouteMappings;
  }
}

/**
Router WRAPPER
*/
declare function RouterPlug(ctx: GrownInterface, util: GrownUtils): RouterClass;

export default RouterPlug;
