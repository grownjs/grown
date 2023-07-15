import type {
  Model, ModelStatic, ModelDefinition, Options, SyncOptions, Sequelize, ConnectionOptions,
  ResourceRepositoryOf, ResourceRepository,
  JSONSchema4,
} from 'json-schema-sequelizer';
import type { GrownInterface, GrownUtils, JsonValue, Plug } from '@grown/bud';
import type { JSONSchemaFakerOptions } from 'json-schema-faker';

export * from 'json-schema-sequelizer';

declare module '@grown/model' {
  interface ModelInterface {
    hooks: any;
    classMethods: any;
    instanceMethods: any;
    getterMethods: any;
    setterMethods: any;
    connection: ConnectionOptions;
    $schema: JSONSchema4;
    getSchema<T>(name?: string): ModelSchema<T>;
    connect<M extends Model>(options?: DatabaseConfig, refs?: JSONSchema4[], cwd?: string): Promise<ModelStatic<M>>;
    define(name: string, params: ModelInterface, _refs?: { [id: string]: JSONSchema4 }): ModelInterface;
    _resolved: boolean;
    _refs: JSONSchema4[];
    _wrap<M extends Model>(id: string, def: M, refs: JSONSchema4[]): ModelStatic<M>;
    _schema<T>(id: string, refs: JSONSchema4[]): ModelSchema<T>;
    _through<T>(id: string, refs: JSONSchema4[]): ModelSchema<T>;
    _fakeFrom(id: string, refs: JSONSchema4[], opts?: JSONSchemaFakerOptions): JsonValue;
    _assertFrom(id: string, ref: string | null, refs: JSONSchema4[], data: JsonValue): void;
    _validateFrom(id: string, ref: string | null, refs: JSONSchema4[], data: JsonValue): boolean;
    _buildValidator(id: string, ref: string | null, refs: JSONSchema4[]): (data: JsonValue) => boolean;
  }

  interface ModelSchema<T> {
    fakeOne(opts?: JSONSchemaFakerOptions): T;
    fakeMany(nth?: number, opts?: JSONSchemaFakerOptions): T[];
    validate(data: unknown): data is T;
    assert(data: unknown, debug?: boolean): data is T;
  }

  interface ModelSpec {
    hooks?: { [key: string]: Function };
    classMethods?: { [key: string]: Function };
    getterMethods?: { [key: string]: Function };
    setterMethods?: { [key: string]: Function };
    instanceMethods?: { [key: string]: Function };
  }

  interface DatabaseOpts {
    main?: string;
    types?: string;
    models: string;
    database: DatabaseInfo;
  }

  interface DatabaseConfig extends Options {
    directory?: string;
    identifier?: string;
    migrations?: {
      database: boolean;
    };
  }

  interface DatabaseInfo {
    use_env_variable?: string | null;
    config: DatabaseConfig,
    refs?: JSONSchema4[];
  }

  interface Repository<DB> {
    connection: ConnectionOptions;
    sequelize: Sequelize;
    typedefs: string;
    schemas: JSONSchema4[];
    models: DB;
    '$refs': { [key: string]: ModelDefinition };
    disconnect(): Promise<ResourceRepositoryOf<DB>>;
    connect(): Promise<ResourceRepositoryOf<DB>>;
    sync(opts?: SyncOptions): Promise<ResourceRepositoryOf<DB>>;
    get(name: keyof DB): ModelInterface;
    get<M extends Model>(name: keyof DB): ModelStatic<M>;
  }

  interface FormatorPlug extends Plug {
    from(model: Model, params: any, options: any): void;
  }

  interface DatabasePlug extends Plug {
    _registry: { [key: string]: ResourceRepository },
    _decorate(source: ModelSpec, target: Model, schemaId: string): Model,
    registered(name: string): boolean;
    register(name: string, params: DatabaseInfo): this;
    bundle<DB>(options: DatabaseOpts): Repository<DB>;
  }

  /**
  Model CLASS
  */
  interface ModelClass extends Plug {
    Formator: FormatorPlug;
    DB: DatabasePlug;
  }

  /**
  Model PLUG
  */
  interface ModelPlug extends Plug {
    Model: ModelClass;
  }
}

declare module '@grown/bud' {
  interface GrownInterface {
    /**
    Model PROP
    */
    Model: ModelClass;
  }
}

/**
Model WRAPPER
*/
declare function ModelPlug(ctx: GrownInterface, util: GrownUtils): ModelClass;

export default ModelPlug;
