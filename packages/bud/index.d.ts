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
    /**
    Enable CORS for all requests, disabled if `NODE_ENV=production`
    */
    cors?: boolean;
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
    LOADS
    */
    load(cwd: string, hooks?: any): any;
    load<T>(cwd: string, hooks?: any): T;

    /**
    DEFNS
    */
    defn(name: string, fn: any): any;

    /**
    EXTENDS
    */
    use(cb: GrownPlugin): Plug;
    use<P extends Plug>(cb: GrownPlugin): P;

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
