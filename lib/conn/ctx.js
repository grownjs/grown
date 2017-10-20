'use strict';

const debug = require('debug')('grown:conn');

const errorHandler = require('../util/error');
const util = require('../util');

const statusCodes = require('http').STATUS_CODES;
const qs = require('querystring');
const url = require('url');
const path = require('path');
const typeIs = require('type-is');
const accepts = require('accepts');
const send = require('send');
const fs = require('fs-extra');

const reTrimSlash = /^\/+/;
const reMatchInfo = /^data:(.+?);base64,/;

function _fixURL(location) {
  const _uri = url.parse(location);

  let _query = '';

  /* istanbul ignore else */
  if (_uri.query) {
    _query = qs.stringify(qs.parse(_uri.query));
  }

  return [
    _uri.protocol ? `${_uri.protocol}//` : '',
    _uri.hostname ? _uri.hostname : '',
    _uri.port ? `:${_uri.port}` : '',
    _uri.pathname ? _uri.pathname : '',
    _query ? `?${_query}` : '',
  ].join('');
}

const Conn = {
  init($, server, req, res) {
    const _resp = {
      is: 'blank',
      type: 'text/html',
      state: {},
      body: null,
      status: null,
      charset: 'utf8',
    };

    const _filters = [];
    const _environment = {};

    // skip npm-cli keys
    Object.keys(process.env).forEach(key => {
      if (key.indexOf('npm_') === -1) {
        _environment[key] = process.env[key];
      }
    });

    return {
      props: {
        // pipeline status
        halted: () => (
            _resp.is === 'halted'
          || _resp.is === 'errored'
          || (_resp.body !== null || _resp.status !== null)
        ),

        // shared helpers
        util: () => $._ctx.util,

        // standard request and response objects
        req: () => req,
        res: () => res,

        // emitter-only
        emit: () => $._ctx.emit,

        // read settings
        config: () => $._ctx.config,

        // current environment
        env: () => util.extend({}, _environment),

        // current connection
        host: () =>
          (req.headers.host && req.headers.host.split(':')[0])
          || (server ? (server.location.host || server.host) : null)
          || process.env.HOST || '0.0.0.0',

        port: () =>
          (req.headers.host && req.headers.host.split(':')[1])
          || (server ? (server.location.port || server.port) : null)
          || process.env.PORT || '8080',

        scheme: () =>
          (server ? (server.location.scheme || server.location.protocol) : null),

        remote_ip: () => '0.0.0.0',
        script_name: () => path.resolve(process.argv[1]),

        method: () => req.method,
        params: () => util.extend({}, this.path_params, this.query_params, this.body_params),
        handler: () => util.extend({}, req.handler || {}),

        path_info: () => req.url.split('?')[0].split('/').filter(x => x),
        path_params: () => util.extend({}, req.params || {}),
        body_params: () => util.extend({}, req.body || {}),
        request_path: () => req.url.split('?')[0],

        query_string: () => req.url.split('?')[1] || '',
        query_params: () => qs.parse(req.url.split('?')[1] || ''),

        is: () => typeIs.bind(null, req),
        accept: () => accepts(req),

        // request headers
        req_headers: () => util.extend({}, req.headers),

        // response body
        has_body: () => _resp.body !== null,

        // ajax
        is_xhr: () => req.headers['x-requested-with'] === 'XMLHttpRequest',
        is_json: () => typeIs.is(req.headers['content-type'], ['json']) === 'json',

        status_code: () => (_resp.status !== null
          ? _resp.status
          : 200),

        // shared
        get state() {
          return _resp.state;
        },

        set state(value) {
          _resp.state = value || {};
        },

        get resp_body() {
          return _resp.body;
        },

        set resp_body(value) {
          /* istanbul ignore else */
          if (!(typeof value === 'string' || typeof value === 'object'
            || (value && typeof value.pipe === 'function') || (value instanceof Buffer))) {
            throw new Error(`Invalid resp_body: ${value}`);
          }

          debug('#%s Set body', this.pid);

          _resp.body = value;
        },

        get resp_charset() {
          return _resp.charset;
        },

        set resp_charset(value) {
          _resp.charset = value || 'utf8';
        },

        get resp_headers() {
          return util.extend({}, res._headers);
        },

        set resp_headers(value) {
          res._headers = value || {};
        },
      },
      methods: {
        sleep(ms) {
          return new Promise(ok =>
            setTimeout(ok, ms || 1000));
        },

        // in-memory cache
        cached(key, ttl, cb) {
          /* istanbul ignore else */
          if (typeof ttl === 'function') {
            cb = ttl;
            ttl = 300;
          }

          /* istanbul ignore else */
          if (typeof $._cache[key] !== 'undefined'
            && (new Date() - $._cache[key].now) < (ttl * 1000)) {
            return $._cache[key].value;
          }

          return Promise.resolve()
            .then(() => cb())
            .then(value => {
              const now = new Date();

              $._cache[key] = { now, value };

              return value;
            });
        },

        before_send(cb) {
          /* istanbul ignore else */
          if (this.pid) {
            debug('#%s Registering before_send handler', this.pid);
          }

          _filters.push(cb);

          return this;
        },

        save_base64(data, destDir) {
          if (!destDir || !fs.existsSync(destDir)) {
            throw new Error(`Expecting a valid directory, given '${destDir}'`);
          }

          const details = data.match(reMatchInfo)[1].split(';');
          const base64Data = data.replace(reMatchInfo, '');

          const name = `${base64Data.substr(0, 7)}/${details[1].split('name=')[1]}`;
          const file = path.join(destDir, name);

          fs.outputFileSync(file, base64Data, 'base64');

          return {
            mimeType: details[0],
            fileSize: fs.statSync(file).size,
            fileName: name.replace(reTrimSlash, ''),
            filePath: file,
          };
        },

        send_file(entry, mimeType) {
          /* istanbul ignore else */
          if (typeof entry === 'object') {
            mimeType = entry.type || mimeType;
            entry = entry.file;
          }

          _resp.is = 'halted';

          const pathname = encodeURI(path.basename(entry));

          const file = send(req, pathname, {
            root: path.dirname(entry),
          });

          file.on('headers', _res => {
            /* istanbul ignore else */
            if (mimeType) {
              _res.setHeader('Content-Type', mimeType);
            }
          });

          return new Promise((resolve, reject) => {
            file.on('error', reject);
            file.on('end', resolve);
            file.pipe(res);
          })
          .then(() => {
            _resp.is = 'done';
          });
        },

        get_req_header(name, defvalue) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_header: '${name}'`);
          }

          /* istanbul ignore else */
          if (typeof req.headers[name] === 'undefined') {
            return defvalue;
          }

          return req.headers[name];
        },

        put_req_header(name, value) {
          /* istanbul ignore else */
          if (!name || typeof name !== 'string') {
            throw new Error(`Invalid req_header: '${name}' => '${value}'`);
          }

          req.headers[name] = value;

          return this;
        },

        delete_req_header(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_header: '${name}'`);
          }

          delete req.headers[name];

          return this;
        },

        // response headers
        get_resp_header(name) {
          return res.getHeader(name);
        },

        put_resp_header(name, value) {
          /* istanbul ignore else */
          if (!name || typeof name !== 'string') {
            throw new Error(`Invalid resp_header: '${name}' => '${value}'`);
          }

          res.setHeader(name, value);

          return this;
        },

        merge_resp_headers(headers) {
          /* istanbul ignore else */
          if (!(headers && (typeof headers === 'object' && !Array.isArray(headers)))) {
            throw new Error(`Invalid resp_headers: '${headers}'`);
          }

          Object.keys(headers).forEach(key => {
            this.put_resp_header(key, headers[key]);
          });

          return this;
        },

        delete_resp_header(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_header: '${name}'`);
          }

          res.removeHeader(name);

          return this;
        },

        put_resp_content_type(mimeType) {
          /* istanbul ignore else */
          if (!(mimeType && typeof mimeType === 'string')) {
            throw new Error(`Invalid type: '${mimeType}'`);
          }

          _resp.type = mimeType;

          return this;
        },

        set_state(name, value) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid set_state: '${name}' => '${value}'`);
          }

          util.set(_resp.state, name, value);

          return this;
        },

        merge_state(values) {
          /* istanbul ignore else */
          if (!(values && (typeof values === 'object' && !Array.isArray(values)))) {
            throw new Error(`Invalid merge_state: '${values}'`);
          }

          Object.keys(values).forEach(key => {
            this.set_state(key, values[key]);
          });

          return this;
        },

        has_status(code) {
          return code
            ? _resp.status === code
            : _resp.status !== null;
        },

        put_status(code) {
          /* istanbul ignore else */
          if (!(code && statusCodes[code])) {
            throw new Error(`Invalid put_status: ${code}`);
          }

          debug('#%s Set status %s', this.pid, code);

          _resp.status = code;

          return this;
        },

        redirect(location, timeout, body) {
          /* istanbul ignore else */
          if (!(location && typeof location === 'string')) {
            throw new Error(`Invalid location: '${location}`);
          }

          /* istanbul ignore else */
          if (timeout) {
            const meta = `<meta http-equiv="refresh" content="${timeout};url=${location}">${body || ''}`;

            this.resp_body = meta;
            this.layout = false;

            return this.end(302);
          }

          debug('#%s Done. Redirection was found', this.pid);

          return this.put_resp_header('Location', _fixURL(location)).end(302);
        },

        raise(code, message) {
          throw util.ctx.error(code || 500, message);
        },

        json(value) {
          /* istanbul ignore else */
          if (!value || typeof value !== 'object') {
            throw new Error(`Invalid JSON value: ${value}`);
          }

          this.layout = false;
          this.resp_body = value;

          return this.end();
        },

        end(code, message) {
          /* istanbul ignore else */
          if (_resp.is !== 'blank' || res.finished) {
            return Promise.resolve();
          }

          let _code = code;

          /* istanbul ignore else */
          if (typeof code === 'string' || code instanceof Buffer) {
            message = code;
            _code = 200;
          }

          if (code instanceof Error) {
            errorHandler(code, this);
          } else {
            // normalize output
            _resp.body = typeof _code === 'string' ? _code : message || _resp.body;

            // normalize response
            _resp.status = typeof _code === 'number' ? _code : _resp.status;
          }

          // fixed status code
          res.statusCode = this.status_code;
          res.statusMessage = statusCodes[this.status_code];

          const _count = _filters.length;

          return Promise.resolve()
            .then(() =>
              _filters.reduce((prev, cb) => prev.then(() => cb(this)), Promise.resolve()))
            .then(() => Promise.resolve(_resp.body))
            .then(_body => {
              _resp.is = 'halted';

              debug('#%s Done. %s before_send filter%s %s run',
                this.pid,
                _count,
                _count === 1 ? '' : 's',
                _count === 1 ? 'was' : 'were');

              _resp.type = _resp.type || 'application/octet-stream';

              /* istanbul ignore else */
              if (_body && typeof _body.pipe === 'function') {
                debug('#%s Done. Response body is an stream. Sending as %s', this.pid, _resp.type);

                res.setHeader('Content-Type', _resp.type);
                res.writeHead(res.statusCode);

                _body.pipe(res);
                _resp.is = 'done';

                return;
              }

              /* istanbul ignore else */
              if (_body !== null && Buffer.isBuffer(_body)) {
                debug('#%s Response body is a buffer. Sending as %s', this.pid, _resp.type);

                res.setHeader('Content-Type', _resp.type);
                res.setHeader('Content-Length', _body.length);
              } else if (_body !== null && typeof _body === 'object') {
                debug('#%s Response body is an object. Sending as application/json', this.pid);

                _body = JSON.stringify(_body);
                _resp.type = 'application/json';
              }

              res.setHeader('Content-Type', `${_resp.type}; charset=${_resp.charset}`);
              res.setHeader('Content-Length', Buffer.byteLength(_body));

              // normalize response
              res.writeHead(res.statusCode);
              res.write(_body || '');
              res.end();

              _resp.is = 'done';
            })
            .catch(e => {
              _resp.is = 'errored';

              try {
                errorHandler(e, this, !this.is_xhr);

                if (!this.res.finished) {
                  res.writeHead(500, this.resp_headers);
                  res.write(this.resp_body);
                  res.end();
                } else {
                  debug('#%s Response already sent', this.pid);
                }
              } catch (_e) {
                debug('#%s Fatal. %s', this.pid, _e.message);
              }
            });
        },
      },
    };
  },
};

module.exports = ($, _server, req, res) => {
  const $ctx = $._ctx.extensions('Conn');

  // before_send filters
  const tasks = [];

  $ctx.extensions.forEach(mixin => {
    /* istanbul ignore else */
    if (mixin.before_send) {
      /* istanbul ignore else */
      if (typeof mixin.before_send !== 'function') {
        throw new Error(`Invalid before_send: ${mixin.before_send}`);
      }

      tasks.push(conn => {
        try {
          return mixin.before_send.call(conn);
        } catch (e) {
          debug('#%s Mixin <%s> failed. %s', conn.pid, mixin.identifier || '?', e.message);
          return conn.end(e);
        }
      });
    }
  });

  const conn = $ctx(Conn).new($, _server, req, res);

  conn.before_send(() => {
    conn.merge_state({
      config: conn.config,
      util: conn.util,
      env: conn.env,
      pid: conn.pid,
      host: conn.host,
      port: conn.port,
      method: conn.method,
      params: conn.params,
      is_xhr: conn.is_xhr,
      is_json: conn.is_json,
      remote_ip: conn.remote_ip,
      path_info: conn.path_info,
      script_name: conn.script_name,
      request_path: conn.request_path,
      query_string: conn.query_string,
      query_params: conn.query_params,
    });
  });

  tasks.forEach(cb =>
    conn.before_send(cb));

  return conn;
};
