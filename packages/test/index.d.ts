import type { GrownInterface, GrownUtils } from '@grown/bud';
import type { Body, Method, ResponseHandler } from '@grown/server';

declare module '@grown/test' {
  /**
  REQ PARAMS
  */
  type RequestParams = {
    url?: string;
    body?: Body;
    method?: Method;
    headers?: Headers;
    attachments?: Attachment[];
  };

  /**
  ATTACHMENT
  */
  type Attachment = {
    /**
    NAME
    */
    name: string;

    /**
    PATH
    */
    path: string;
  };

  /**
  TEST CLASS
  */
  type TestClass = {
    /**
    REQUEST PROP
    */
    Request: any;

    /**
    SOCKETS PROP
    */
    Sockets: any;

    /**
    MOCK PROP
    */
    Mock: any;
  };

  /**
  TEST PLUG
  */
  type TestPlug = {
    Test: TestClass;
  };
}

declare module '@grown/server' {
  interface Response {
    /**
    TEST CHECK
    */
    ok(err: Error | null, body: number, message?: string): void;
    ok(err: Error | null, body?: string, status?: number, message?: string): void;
  }
}

declare module '@grown/bud' {
  interface GrownInterface {
    Test: TestClass;
  }

  interface GrownInstance {
    /**
    REQ METHOD
    */
    request(url: string, callback: ResponseHandler): Promise<any>;
    request(url: string, method: Method, callback: ResponseHandler): Promise<any>;
    request(url: string, method: Method, options: RequestParams, callback: ResponseHandler): Promise<any>;
  }
}

/**
TEST WRAPPER
*/
declare function TestPlug(ctx: GrownInterface, util: GrownUtils): TestClass;

export default TestPlug;

import 'mocha';
import 'chai';
