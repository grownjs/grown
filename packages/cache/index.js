'use strict';

const debug = require('debug')('grown:cache');

module.exports = (Grown, util) => {
  const Redis = require('ioredis');

  const _registry = Object.create(null);

  return Grown('Cache', {
    _registry,

    connection: 'default',

    registered(name) {
      return !!this._registry[name];
    },

    register(name, params = {}) {
      if (!this._registry[name]) {
        if (!params.identifier) {
          params.identifier = name;
        }

        const opts = {
          url: params.use_env_variable && process.env[params.use_env_variable],
          ...params,
        };

        delete opts.use_env_variable;
        delete opts.identifier;

        this._registry[name] = new Redis(opts);
        this._registry[name].close = this._registry[name].quit;

        util.readOnlyProperty(this, name, () => this._registry[name]);
      }
      return this;
    },

    cached(name, opts) {
      const _client = this.register(name, opts)[name];

      debug('#%s Cache connection <%s>', process.pid, name);

      return _client;
    },

    connect(options) {
      const opts = typeof this.connection === 'string'
        ? { identifier: this.connection, ...options }
        : { ...this.connection, ...options };

      return this.cached(opts.identifier || 'default', opts);
    },

    $install() {
      const client = this.connect();

      return {
        props: {
          cache: () => client,
        },
        methods: {
          cached: name => this.cached(name),
        },
      };
    },

    $mixins() {
      return {
        props: {
          cache: () => this.connect(),
        },
        methods: {
          cached: name => this.cached(name),
        },
      };
    },
  });
};
