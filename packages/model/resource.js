'use strict';

const debug = require('debug')('grown:model:resource');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  function _buildAttachments(Model, options) {
    const _attachments = [];

    /* istanbul ignore else */
    if (Model.options.$schema.properties) {
      Object.keys(Model.options.$schema.properties).forEach(key => {
        const x = Model.options.$schema.properties[key].attachment;

        /* istanbul ignore else */
        if (x) {
          const dest = options(typeof x === 'string' ? x : 'paths.uploads');

          _attachments.push({
            key,
            dest,
            baseDir: options('cwd'),
          });
        }
      });
    }

    return _attachments;
  }

  function _buildResource(Model, conn, options) {
    const refs = Grown.Model.DB[Model.database].$refs;

    const config = {
      attachments: this._buildAttachments(Model, options),
      payload: conn.req.params.payload,
      where: conn.req.params.where,
    };

    /* istanbul ignore else */
    if (Model.primaryKeyAttribute) {
      config[Model.primaryKeyAttribute] = null;
    }

    const resource = JSONSchemaSequelizer.resource(refs, Model, config);

    resource.options.isNew = conn.req.handler.action === 'new';
    resource.options.action = conn.req.handler.action;
    resource.options.actions = {};
    resource.options.actions[Model.name] = {
      index: {
        verb: 'GET',
        path: '/',
      },
    };

    ['new', 'create', 'edit', 'show', 'update', 'destroy'].forEach(method => {
      resource.options.actions[Model.name][method] = {
        verb: 'GET',
        path: '/',
      };
    });

    conn.state.resource = resource.options;

    function end(location) {
      /* istanbul ignore else */
      if (location) {
        return conn.redirect(location);
      }
    }

    function err(e, location) {
      debug('#%s Wait. Resource failed: %s', conn.pid, e.stack);

      conn.status_code = 400;

      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result: e.message || e.toString(),
          errors: e.errors || [],
          status: 'error',
          redirect: location,
        });
      }

      /* istanbul ignore else */
      if (!location) {
        debug('#%s Skip. Resource was errored', conn.pid);

        return conn.end(util.cleanError(e, options('cwd')));
      }

      return end(location);
    }

    function ok(result, location) {
      debug('#%s OK. Resource finished', conn.pid);

      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result,
          status: 'ok',
          redirect: location,
        });
      }

      return end(location);
    }

    let _method = conn.req.handler.action;

    return Promise.resolve()
      .then(() => {
        /* istanbul ignore else */
        if (typeof Model.setResource === 'function') {
          return Model.setResource(conn, resource);
        }
      })
      .then(() => {
        /* istanbul ignore else */
        if (_method === 'new') {
          return ok(resource.options);
        }

        /* istanbul ignore else */
        if (_method === 'index') {
          _method = 'findAll';
        }

        /* istanbul ignore else */
        if (_method === 'edit' || _method === 'show') {
          _method = 'findOne';
        }
      })
      .then(() => {
        /* istanbul ignore else */
        if (_method.indexOf('find') === 0 || !Model.virtual) {
          return resource.actions[_method]();
        }
      })
      .then(result => {
        debug('#%s %s loaded', conn.pid, Model.name);

        resource.options.result = result;

        /* istanbul ignore else */
        if (resource.isNew || conn.req.handler.action === 'edit') {
          return ok(resource.options);
        }

        return ok(result);
      })
      .catch(e => err(e));
  }

  function _findModel(resource) {
    return util.getProp(Grown, resource,
      new Error(`Resource missing, given '${resource}'`));
  }

  return Grown.module('Model.Resource', {
    _buildAttachments,
    _buildResource,
    _findModel,

    dispatch(resource) {
      return (conn, options) =>
        this._buildResource(this._findModel(resource), conn, options);
    },

    install(ctx) {
      ctx.mount('Model.Resource#pipe', (conn, options) => {
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

        return this._buildResource(Model, conn, options);
      });
    },
  });
};
