'use strict';

/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const JSONSchemaSequelizer = require('json-schema-sequelizer');
const Sequelize = require('sequelize');

const path = require('path');
const fs = require('fs');

module.exports = (cwd) => {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
  }

  const _defaults = require(path.join(cwd, 'config', 'database.js'));
  const _environment = process.env.NODE_ENV || 'dev';
  const _options = _defaults[_environment];
  const _config = _options || _defaults;

  // db-migrate
  _config.driver = _config.dialect;
  _config.filename = _config.storage;

  return ($) => {
    const dir = path.join(cwd, 'models');
    const opts = new Sequelize(_config);
    const refs = [];

    $.initializers.push(() => new JSONSchemaSequelizer(opts, refs, dir)
      .then((m) => {
        // models are available inside the connection
        $.ctx.extensions('Homegrown.conn', {
          props: {
            models: m,
          },
        });

        // models are available statictly
        $.ctx.extensions.models = m;

        return m.sync();
      }));
  };
};
