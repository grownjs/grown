import type { Connection } from '@grown/server';

declare module '@grown/graphql' {
  /**
  GRAPHQL PROPS
  */
  type GraphQLClass = {
    setup(schemas: string[], container: any): (ctx: Connection) => Promise<void>;
  };

  /**
  GRAPHQL PLUG
  */
  type GraphQLPlug = {
    GraphQL: GraphQLClass;
  };
}

declare module '@grown/bud' {
  interface GrownInterface {
    /**
    GraphQL PROP
    */
    GraphQL: GraphQLClass;
  }
}
