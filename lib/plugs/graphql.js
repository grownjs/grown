'use strict';

const debug = require('debug')('grown:graphql');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

module.exports = opts => {
  opts = opts || {};

  const _folders = [];

  ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
    _folders.push(path.relative(process.cwd(), cwd));
  });

  return $ => {
    let _schema;

    const models = $.extensions('Conn._.models', false);

    const graphql = require('graphql').graphql;
    const graphqlHTTP = require('express-graphql');
    const graphqlSequelize = require('graphql-sequelize');
    const mergeTypes = require('merge-graphql-schemas').mergeTypes;
    const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;

    // static interface
    const _graphql = queryString => graphql(_schema, queryString);

    // attach references
    _graphql.schemas = [];
    _graphql.resolvers = [];

    // attach graphql-sequelize
    _graphql.sequelize = modelName => {
      let _wrapper;

      return function resolver() {
        const model = $.util.get(models, modelName, new Error(`Missing model ${modelName}`));

        try {
          if (!_wrapper) {
            debug('Trying to resolve model <%s>', modelName);

            _wrapper = graphqlSequelize.resolver(model);
          }
        } catch (e) {
          throw new Error(`Unable to resolve(${modelName}). ${e.mssage}`);
        }

        return _wrapper.apply(null, arguments);
      };
    };

    // lazy loading for resolvers
    $.extensions('Conn._').graphql = _graphql;

    $.extensions('Conn', {
      props: {
        graphql: _graphql,
      },
    });

    // instantiate types and such
    $.on('start', () => {
      // from models
      Object.keys(models).forEach(name => {
        if (models[name].options.$graphql) {
          if (typeof models[name].options.$graphql === 'string') {
            _graphql.schemas.push(models[name].options.$graphql.trim());
          }

          if (models[name].options.graphqlMutators) {
            _graphql.resolvers.push(models[name].options.graphqlMutators);
          }

          if (models[name].options.graphqlResolvers) {
            _graphql.resolvers.push(models[name].options.graphqlResolvers);
          }

          if (!models[name].virtual) {
            const fields = graphqlSequelize.attributeFields(models[name]);

            Object.keys(models[name].attributes).forEach(k => {
              const values = models[name].attributes[k].type.values;
              const field = fields[k].type.name;

              if (field && values) {
                _graphql.schemas.push(`enum ${field} {\n  ${values.join('\n  ')}\n}`);
              }
            });

            _graphql.schemas.push(`type ${name} {\n  ${Object.keys(fields)
              .map(k => `${k}: ${fields[k].type}`)
              .join('\n  ')}\n}`);
          }
        }
      });

      // other sources
      _folders.forEach(baseDir => glob.sync('**/*.{js,graphql}', { cwd: path.join($.cwd, baseDir) }).forEach(file => {
        const name = path.basename(file);

        if (name === 'resolvers.js' || name === 'mutators.js') {
          let resolver = require(path.join($.cwd, baseDir, file));

          if (typeof resolver === 'function') {
            resolver = resolver($.extensions('Conn._'));
          }

          _graphql.resolvers.push(resolver);
        }

        if (name === 'schema.graphql') {
          _graphql.schemas.push(fs.readFileSync(path.join($.cwd, baseDir, file)).toString().trim());
        }
      }));

      if (!_graphql.schemas.length) {
        throw new Error('Missing schemas for GraphQL');
      }

      if (!_graphql.resolvers.length) {
        throw new Error('Missing resolvers for GraphQL');
      }

      try {
        _schema = makeExecutableSchema({
          typeDefs: mergeTypes(_graphql.schemas),
          resolvers: $.util.extend(_graphql.resolvers),
        });
      } catch (e) {
        throw new Error(`Unable to start GraphQL. ${e.message}`);
      }

      // built-in client
      $.on('repl', repl => {
        const logger = $.logger.getLogger();

        repl.defineCommand('graphql', {
          help: 'Query anything to your GraphQL setup',
          action(value) {
            repl.pause();

            _graphql(value)
              .then(result => {
                logger.info('\r{% gray %s %}\r\n', JSON.stringify(result, null, 2));
              })
              .catch(e => {
                logger.info('\r{% error %s %}\r\n', $.util.getError(e, $.flags));
              })
              .then(() => {
                repl.resume();
                repl.displayPrompt();
              });
          },
        });
      });

      // build middleware
      const run = graphqlHTTP({
        schema: _schema,
        graphiql: $.env === 'development',
      });

      // by-pass factory checks for x-function wrappers (fn.length > 2)
      $.mount(opts.endpoint || '/graphql', (req, res, next) => run(req, res, next));
    });
  };
};
