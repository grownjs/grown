const util = require('../../../../lib/util');

const TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
const PROPS = ['required', 'primaryKey', 'autoIncrement', 'hasOne', 'belongsTo'];

// TODO:
// grown g model.views Admin.Databases.User app/views
// grown g model.routes Admin.Databases.User config/routes.js

const MODEL_USAGE = `
* Attribute types are declared as {% yellow prop:type %}
* Relationships can be specified as {% yellow prop:Model %}
* Other attributes are passed as booleans (e.g. primaryKey)
* A primary field is added automatically unless you pass --no-id

Examples:
  grown add model Account app/models name:string
  grown add model User app/models email:string account:Account

Options:
  --timestamps --paranoid --no-id
`;

const MODEL_CTRL_USAGE = `
This will add a controller file for any model.

Example:
  grown add model.ctrl User app/controllers
`;

const MODEL_TPL_USAGE = `
This will add some views for any model.

Example:
  grown add model.tpl User app/templates
`;

const CTRL_TPL = `module.exports = {
  methods: {
    index() {},
    show() {},
    edit() {},
    new() {},
    create() {},
    update() {},
    destroy() {},
  },
};
`;

function isUpper(str) {
  return /^[A-Z]/.test(str.charAt());
}

module.exports = haki => {
  haki.setGenerator('model', {
    description: 'Add a new model',
    arguments: ['NAME', 'DEST'],
    abortOnFail: true,
    options: 'attrs',
    usage: MODEL_USAGE,
    prompts: [{
      name: 'NAME',
      message: 'Model name:',
      validate: value => value.length > 0 || "Don't forget name your model",
    }, {
      name: 'DEST',
      message: 'Destination path:',
      validate: value => value.length > 0 || "Please specify your models' path",
    }],
    actions(values, opts) {
      const _fields = [];

      const _schema = {
        type: 'object',
        options: {
          timestamps: opts.timestamps === true,
          paranoid: opts.paranoid === true,
        },
        required: [],
        properties: {},
      };

      const _uiSchema = {
        'ui:order': ['*'],
      };

      if (opts.id !== false && !opts.params.id) {
        _fields.unshift('id');
        _schema.properties.id = {
          type: 'integer',
          primaryKey: true,
          autoIncrement: true,
        };
      }

      Object.keys(opts.params).forEach(prop => {
        if (!isUpper(opts.params[prop])) {
          _fields.push(prop);
        }

        opts.params[prop].split(':').forEach(key => {
          if (key === 'required') {
            _schema.required.push(prop);
            return;
          }

          if (isUpper(key)) {
            _schema.properties[prop] = { $ref: key };
            _uiSchema[prop] = {
              'ui:editable': true,
            };
            _uiSchema['ui:order'].unshift(prop);
            return;
          }

          if (!_uiSchema[prop]) {
            _uiSchema[prop] = { 'ui:disabled': false };
          }

          if (!_schema.properties[prop]) {
            _schema.properties[prop] = {};
          }

          if (TYPES.indexOf(key) > -1) {
            _schema.properties[prop].type = key;
          }

          if (PROPS.indexOf(key) > -1) {
            _schema.properties[prop][key] = true;
          }
        });
      });

      const MODEL_TEMPLATE = `module.exports = ${util.serialize({
        $schema: _schema,
        $uiSchema: _uiSchema,
        $attributes: { findAll: _fields },
      }, 0)};\n`;

      return [{
        type: 'add',
        dest: '{{{DEST}}}/{{resource NAME}}.js',
        content: MODEL_TEMPLATE,
      }];
    },
  });

  haki.setGenerator('model.tpl', {
    description: 'Add views for model',
    arguments: ['NAME', 'DEST'],
    abortOnFail: true,
    usage: MODEL_TPL_USAGE,
    prompts: [{
      name: 'NAME',
      message: 'Resource name:',
      validate: value => value.length > 0 || "Don't forget name your resource",
    }, {
      name: 'DEST',
      message: 'Destination path:',
      validate: value => value.length > 0 || "Please specify your resource's path",
    }],
    actions: [{
      type: 'add',
      dest: '{{{DEST}}}/{{normalize NAME}}/edit.js.pug',
      content: '//- TODO',
    }, {
      type: 'add',
      dest: '{{{DEST}}}/{{normalize NAME}}/index.js.pug',
      content: '//- TODO',
    }, {
      type: 'add',
      dest: '{{{DEST}}}/{{normalize NAME}}/new.js.pug',
      content: '//- TODO',
    }],
  });

  haki.setGenerator('model.ctrl', {
    description: 'Add a model controller',
    arguments: ['NAME', 'DEST'],
    abortOnFail: true,
    usage: MODEL_CTRL_USAGE,
    prompts: [{
      name: 'NAME',
      message: 'Resource name:',
      validate: value => value.length > 0 || "Don't forget name your resource",
    }, {
      name: 'DEST',
      message: 'Destination path:',
      validate: value => value.length > 0 || "Please specify your resource's path",
    }],
    actions: [{
      type: 'add',
      dest: '{{{DEST}}}/{{normalize NAME}}.js',
      content: CTRL_TPL,
    }],
  });
};
