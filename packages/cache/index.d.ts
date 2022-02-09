declare module '@grown/cache' {
  type CacheClass = {
    _registry: any;
    connection: any;
    registered: any;
    register: any;
    cached: any;
    connect: any;
    $install: any;
    $mixins: any;
  };

  type CachePlug = {
    Cache: CacheClass;
  };
}

declare module '@grown/bud' {
  interface GrownInterface {
    Cache: CacheClass;
  }

  interface GrownInstance {
    cache: any;
    cached: any;
  }
}

declare module '@grown/server' {
  interface Connection {
    cache: any;
    cached: any;
  }
}

declare function CachePlug(ctx: GrownInterface, util: GrownUtils): CacheClass;

export default CachePlug;

import 'ioredis';
