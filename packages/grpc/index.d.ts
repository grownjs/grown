import type { JsonObject } from '@grown/bud';

declare module '@grown/grpc' {
  export type GRPCService<T> = {
    [K in keyof T & string as `send${K}`]: <R>(method: keyof T[K], data?: JsonObject) => Promise<R>;
  }

  export interface GRPCInterface {
    start: (port?: number) => Promise<this>;
    stop: (cb?: Function) => void;
  }

  /**
  GRPC PROPS
  */
  type GRPCClass = {
    Gateway: any;
    Loader: any;
  };

  /**
  GRPC PLUG
  */
  type GRPCPlug = {
    GRPC: GRPCClass;
  };
}

declare module '@grown/bud' {
  interface GrownInterface {
    /**
    GRPC PROP
    */
    GRPC: GRPCClass;
  }
}
