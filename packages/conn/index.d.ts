import type { GrownInterface, JsonObject } from '@grown/bud';
import type { ReadStream } from 'fs';

declare module '@grown/conn' {
  /**
  CONN BUILDER
  */
  export type ConnBuilder = {
    /**
    CONN CONSTRUCT
    */
    new(): GrownInterface;
  };

  /**
  CONN PROPS
  */
  export type ConnClass = {
    /**
    CONN BUILDER PROP
    */
    Builder: ConnBuilder;
  };

  /**
  CONN PLUG
  */
  export type ConnPlug = {
    Conn: ConnClass;
  };
}

declare module '@grown/server' {
  interface Connection {
    /**
    SET BODY
    */
    set resp_body(out: string | Buffer | ReadStream | JsonObject);

    /**
    GET BODY
    */
    get resp_body(): string;
  }
}
