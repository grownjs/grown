'use strict';

const debug = require('debug')('grown:model-resource');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  function _runHandler(conn, options) {
    const Model = util.getProp(Grown, conn.req.handler.resource,
      new Error(`Resource missing, given '${conn.req.handler.resource}'`));

    debug('#%s %s model found in %s',
      conn.pid,
      Model.name,
      Model.database);

    const refs = Grown.Model.DB[Model.database].$refs;
    const config = {};
    const resource = JSONSchemaSequelizer.resource(refs, Model, config);

    return conn.json(resource);
  }

  return Grown.module('Model.Resource', {
    _runHandler,

    install(ctx) {
      ctx.mount('Model.Resource#pipe', (conn, _options) => {
        debug('#%s Checking for resources', conn.pid);

        /* istanbul ignore else */
        if (!conn.req.handler || !conn.req.handler.resource) {
          debug('#%s No resources found', conn.pid);
          return;
        }

        return this._runHandler(conn, _options);
      });
    },
  });
};
