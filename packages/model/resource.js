'use strict';

const debug = require('debug')('grown:model-resource');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  function _buildResource(Model, conn, options) {
    const refs = Grown.Model.DB[Model.database].$refs;
    const config = {};
    const resource = JSONSchemaSequelizer.resource(refs, Model, config);

    return conn.json(resource);
  }

  function _findModel(resource) {
    return util.getProp(Grown, resource,
      new Error(`Resource missing, given '${resource}'`));
  }

  return Grown.module('Model.Resource', {
    _buildResource,
    _findModel,

    dispatch(resource) {
      return (conn, options) =>
        this._buildResource(this._findModel(resource), conn, options);
    },

    install(ctx) {
      ctx.mount('Model.Resource#pipe', (conn, _options) => {
        debug('#%s Checking for resources', conn.pid);

        /* istanbul ignore else */
        if (!conn.req.handler || !conn.req.handler.resource) {
          debug('#%s No resources found', conn.pid);
          return;
        }

        const Model = this._findModel(conn.req.handler.resource);

        debug('#%s %s model found in %s',
          conn.pid,
          Model.name,
          Model.database);

        return this._buildResource(Model, conn, _options);
      });
    },
  });
};
