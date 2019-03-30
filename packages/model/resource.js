'use strict';

// FIXME: use `json-schema-sequelizer`.resource for this

const debug = require('debug')('grown:model:resource');

// const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  const formator = require('formator');

  //   function _findModel(resource) {
  //     return util.getProp(Grown, resource,
  //       new Error(`Resource missing, given '${resource}'`));
  //   }

  return Grown('Model.Resource', {
    // _buildAttachments,
    // _buildResource,
    // _findModel,

    // dispatch(resource) {
    //   return (conn, options) =>
    //     this._buildResource(this._findModel(resource), conn, options);
    // },

    bind(models, options) {
      return formator(models.sequelize, {
        attributes: false,
        ...options,
      });
    },

    $install(ctx) {
      ctx.mount('Model.Resource#pipe', (conn, options) => {
        debug('#%s Checking for resources', conn.pid);

        /* istanbul ignore else */
        if (!conn.req.handler || !conn.req.handler.resource) {
          debug('#%s No resources found', conn.pid);
          return;
        }

        console.log('OK', options);

        // const Model = this._findModel(conn.req.handler.resource);

        // debug('#%s %s model found in %s connection',
        //   conn.pid,
        //   Model.name,
        //   Model.database);

        // return this._buildResource(Model, conn, options);
      });
    },
  });
};
