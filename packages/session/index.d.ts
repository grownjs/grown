import '@grown/bud';

declare module '@grown/session' {
  type Effects<T> = {
    [key: string]: (req: T, args: any, definition: string) => void;
  };

  type AuthClass = {
    effect<A, B>(cb: (token: string) => void, middleware?: Effects<A>): Promise<B>;
  };

  type SessionClass = {
    Auth: AuthClass;
  };

  /**
  SESSIOn PLUG
  */
  type SessionPlug = {
    Session: SessionClass;
  };
}

declare module '@grown/server' {
  export interface Request {
    /**a token*/
    token: string;
    guid: string;
  }
}

declare module '@grown/bud' {
  interface GrownInterface {
    Session: SessionClass;
  }
}
