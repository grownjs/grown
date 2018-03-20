---
title: Conn
$render: ../../../_/layouts/default.pug
runkit: !include ../../../_/shared/runkit/server.yml
---

TODO

```js
/* @runkit */
// register extension
Grown.use(require('@grown/conn'));

// register middleware
server.plug(Grown.Conn);

// new props/methods are available at `ctx`
server.mount(ctx => {
  if (ctx.is_json) {
    return ctx.json({
      status: 'ok',
      result: ctx.req_headers,
    });
  }

  ctx.resp_body = `<dl>
    <dt>host</dt>
    <dd>${ctx.host}</dd>
    <dt>content_type</dt>
    <dd>${ctx.content_type}</dd>
    <dt>accept_languages</dt>
    <dd>${ctx.accept_languages}</dd>
  </dl>`;
});
```

> Try requesting the endpoint as `application/json`

## Request

### Props <var>mixin</var>

- `req_headers` &mdash;
- `is_xhr` &mdash;
- `is_json` &mdash;
- `has_type` &mdash;
- `host` &mdash;
- `port` &mdash;
- `remote_ip` &mdash;
- `method` &mdash;
- `params` &mdash;
- `path_info` &mdash;
- `path_params` &mdash;
- `body_params` &mdash;
- `request_path` &mdash;
- `query_string` &mdash;
- `query_params` &mdash;
- `accept_charsets` &mdash;
- `accept_encodings` &mdash;
- `accept_languages` &mdash;
- `accept_types` &mdash;

### Methods <var>mixin</var>

- `get_req_header(name, defvalue)` &mdash;
- `put_req_header(name, value)` &mdash;
- `delete_req_header(name)` &mdash;

### Public methods <var>static</var>

- `$mixins()` &mdash;

### Private* methods <var>static</var>

- `_fixURL(location)` &mdash;

---

## Response

### Props <var>mixin</var>

- `has_body` &mdash;
- `has_status` &mdash;
- `content_type` &mdash;
- `status_code` &mdash;
- `resp_body` &mdash;
- `resp_charset` &mdash;

### Methods <var>mixin</var>

- `resp_headers()` &mdash;
- `get_resp_header(name)` &mdash;
- `put_resp_header(name, value)` &mdash;
- `merge_resp_headers(headers)` &mdash;
- `delete_resp_header(name)` &mdash;
- `redirect(location, timeout, body)` &mdash;
- `json(value)` &mdash;
- `send_file(entry, mimeType)` &mdash;
- `send(body)` &mdash;
- `end(code, message)` &mdash;

### Public methods <var>static</var>

- `$mixins()` &mdash;
- `$before_render(ctx, template)` &mdash;

### Private* methods <var>static</var>

- `_finishRequest(ctx, body)` &mdash;
- `_endRequest(ctx, code, message)` &mdash;
- `_cutBody(value)` &mdash;

---

➯ Next: [Extensions &rangle; GraphQL](./docs/extensions/graphql)
