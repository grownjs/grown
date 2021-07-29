import { JsonObject } from '@grown/bud';

declare module '@grown/render' {
  /**
  RENDER PROPS
  */
  export type RenderClass = {
  };

  /**
  RENDER PLUG
  */
  export type RenderPlug = {
    Render: RenderClass;
  };
}

declare module '@grown/server' {
  interface Connection {
    /**
    RENDER
    */
    template(path: string, data?: JsonObject): Promise<string>;
  }
}
