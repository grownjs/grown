import type { PackageJson, JsonObject } from 'type-fest';

declare module '@grown/bud' {
  /**
  NODE_ENV INFO
  */
  type NodeEnv = 'test' | 'staging' | 'development' | 'production';

  /**
  PLUGIN CLASS
  */
  type PlugClass = {
    init?(...args: any): any;
    props?: JsonObject;
    methods?: JsonObject;
  };

  /**
  PLUGIN
  */
  type Plug = {
    $install?(ctx: GrownInterface, scope: any): PlugClass;
    $mixins?(opts: JsonObject): PlugClass;
    [key: string]: any;
  };

  /**
  GROWN OPTS
  */
  interface GrownOptions {
    /**
    GET OPTION
    */
    (key: string, fallback: any): any;
  }

  interface GrownParams {
    env?: NodeEnv,
    plug?: Plug | Plug[],
    /**
    Enable uWebSockets.js support
    */
    uws?: boolean;
    /**
    Adjust the limit value for the body-parser's JSON support as fallback
    */
    json?: string | number;
    /**
    Enable CORS for all requests, disabled if `NODE_ENV=production`
    */
    cors?: boolean;
    cache?: boolean;
    trust?: boolean | string;
    [key:string]: any;
  }

  /**
  GROWN PLUGIN
  */
  interface GrownPlugin {
    (ctx: GrownInterface, util: GrownUtils): any;
  }

  /**
  GROWN UTILS
  */
  interface GrownUtils {
  }

  /**
  GROWN INSTANCE
  */
  interface GrownInstance {
  }

  /**
  GROWN INTERFACE
  */
  interface GrownInterface {
    /**
    BUD CONSTRUCTOR
    @param options Javascript object containing your application settings
    */
    new(options?: GrownParams): GrownInstance;

    /**
    ARGVs
    */
    argv: string[];

    /**
    CWD
    */
    cwd: string;

    /**
    PACK
    */
    pkg: PackageJson;

    /**
    NODE_ENV CUR
    */
    env: NodeEnv;

    /**
    ASYNC
    */
    ready(fn: Function): any;

    /**
    INIT
    */
    main(mod: any, fn: Function): any;

    /**
    LOADS
    */
    load(cwd: string, hooks?: any): any;
    load<T>(cwd: string, hooks?: any): T;

    /**
    MODS
    */
    def(name: string, cwd: string, opts?: any): any;
    def<T>(name: string, cwd: string, opts?: any): T;

    /**
    DEFNS
    */
    defn(name: string, fn: Function): any;
    defn<T>(name: string, fn: Function): T;

    /**
    EXTENDS
    */
    use(cb: GrownPlugin | Promise<any>): Plug | Promise<Plug>;
    use<P extends Plug>(cb: GrownPlugin | Promise<any>): P | Promise<P>;

    /**
    DOES
    */
    do(cb: Function): Promise<any>;
  }
}

/**
 * Creates a new Grown constructor from given `cwd` and `argv`
 * @param cwd Sets the current working directory, default is `process.cwd()`
 * @param argv An array of arguments, default is `process.argv.slice(2)`
 */
declare function createContainer(cwd?: string, argv?: string[]): GrownInterface;

export default createContainer;
export * from 'type-fest';
