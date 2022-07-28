import type { GrownInterface, GrownUtils, JsonObject, PlugClass } from '@grown/bud';

declare module '@grown/server' {
  /**
  BODY
  */
  type Body = string | JsonObject;

  /**
  HTTP METHOD
  */
  type Method = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  /**
  HEADERS
  */
  type Headers = {
    [key: string]: string;
  };

  /**
  CALLBACK
  */
  type Callback = {
    (err: Error | null, result: any): void;
  };

  /**
  REQUEST
  */
  export interface Request {
    /**the url*/
    url: string;
    body: any;
    query: any;
    method: Method;
    headers: Headers;
    rawHeaders: string[];
    connection: ConnectionInfo;
    login(): void;
    logIn(): void;
    logout(): void;
    logOut(): void;
    isAuthenticated(): boolean;
    isUnauthenticated(): boolean;
  }

  /**
  RESPONSE
  */
  interface Response {
    aborted: boolean;
    finished: boolean;

    /**
    STATUS_CODE
    */
    statusCode: number;
    statusMessage: string;

    /**
    END()
    */
    end(data?: any, encoding?: string, callback?: Callback): void;

    send(): void;
    json(): void;
    status(): void;
    sendFile(): void;
    writeHead(): void;
    setHeader(): void;
    getHeader(): void;
    removeHeader(): void;
  }

  /**
  CONN
  */
  interface Connection {
    /**
    REQ
    */
    req: Request;

    /**
    RES
    */
    res: Response;

    /**
    FIXME: env:
    */
    // env: JsonObject;

    /**
    FIXME: is_finished
    */
    is_finished: boolean;

    /**
    FIXME: halted
    */
    halted: boolean;

    /**
    FIXME: state
    */
    state: JsonObject;

    /**
    FIXME: pid:
    */
    pid: any;


    /**
    FIXME: halt
    */
    halt(): Promise<any>;

    /**
    FIXME: raise
    */
    raise(): void;

    cors(): boolean | void;
    nocache(): void;
  }

  /**
  CONNECTION INFO
  */
  type ConnectionInfo = {
    remoteAddress: string;
    encrypted: boolean;
  };

  /**
  REQUEST INFO
  */
  type RequestInfo = {
    url?: string;
    method?:  Method;
    headers?: Headers;
  };

  /**
  LOCATION
  */
  type LocationInfo = {
    host?: string;
    port?: number;
    protocol?: 'http' | 'https';
  };

  /**
  SERVER OPTS
  */
  type ServerOptions = {
    ca?: any;
    key?: any;
    cert?: any;
  };

  /**
  ERR HANDLER
  */
  type ResponseHandler = {
    /**
    ERR HANDLER CALLBACK
    */
    (err: Error | null, conn: Connection): void;
  };

  /**
  REQ HANDLER
  */
  type RequestHandler = {
    /**
    REQ HANDLER CALLBACK
    */
    (conn: Connection, options: any): void;
  };

  /**
  EV HANDLER
  */
  type EventHandler = {
    /**
    Event handler or callback
    @param args Any kind of arguments given on `emit()` calls
    */
    (...args: any[]): void;
  };

  /**
  SERVER CLASS
  */
  type ServerClass = {
    /**
    create method
    */
    create(): PlugClass;
  };
}

declare module '@grown/bud' {
  /**
  SERVER PLUG
  */
  interface GrownInterface {
    Server: ServerClass;
  }

  /**
  SERVER INSTANCE
  */
  interface GrownInstance {
    /**
    Subscribe to a life-cycle event
    @param evt The event name to subscribe from
    @param cb Callback function to handle `emit()` calls
    */
    on(evt: string, cb: EventHandler): this;
    /**
    FIXME: off
    */
    off(evt: string, cb: EventHandler): this;
    /**
    FIXME: once
    */
    once(evt: string, cb: EventHandler): this;
    /**
    FIXME: emit
    */
    emit(evt: string, ...args: any[]): this;
    /**
    FIXME: run
    */
    run(req: RequestInfo, cb: ResponseHandler): void;
    /**
    FIXME: plug
    */
    plug(...args: Plug[]): this;
    plug(ext: Plug | Plug[]): this;
    /**
    FIXME: mount
    */
    mount(...args: [path?: RequestHandler] | [path?: string, cb?: RequestHandler]): this;
    /**
    Starts listening on the given address or port
    @param addr It can be a port number, or an address to bind
    */
    listen(addr?: number | string | Location, opts?: ServerOptions): this;
    /**
    FIXME: clients
    */
    clients(): void;
  }
}

/**
TEST WRAPPER
*/
declare function ServerPlug(ctx: GrownInterface, util: GrownUtils): ServerClass;

export default ServerPlug;
