---
title: Conn
next:
  label: Extensions &rangle; GraphQL
  link: docs/extensions/graphql
$render: ~/src/lib/layouts/default.pug
runkit: !include ~/src/lib/shared/runkit/server.yml
---

High level details for the current connection. ⚓

```js
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

> Click <kbd>▷ RUN</kbd> and try requesting the endpoint as `application/json` &mdash; or use [`this link`](/) to perform a regular request.

<div id="target"></div>

## Request

### Props <var>mixin</var>

- `req_headers` &mdash; Return all the request headers as an object.
- `is_xhr` &mdash; Returns `true` if the connection was made through XHR (`x-requested-with`).
- `is_json` &mdash; Returns `true` if the connection requested as `application/json`.
- `has_type` &mdash; Returns `true` if the connection requested a known type.
- `host` &mdash; Current connection host.
- `port` &mdash; Current connection port.
- `remote_ip` &mdash; Remote client's IP.
- `method` &mdash; Normalized request method as it can be sent as `_method`.
- `params` &mdash; Combination of `path_params`, `query_params` and `body_params` merged.
- `path_info` &mdash; Return `request_path` segments as array.
- `path_params` &mdash; Return the path params as an object, if any.
- `body_params` &mdash; Returns the body payload as an object, if any.
- `request_path` &mdash; Returns the fixed path of requested resources.
- `query_string` &mdash; Returns the raw query-string from the connection.
- `query_params` &mdash; Returns the `query_string` parsed as an object.
- `accept_charset(s)` &mdash; If singular, returns `true` if the connection accepts this charset. As plural, will return all accepted charsets by the current connection.
- `accept_encoding(s)` &mdash; If singular, returns `true` if the connection accepts this encoding. As plural, will return all accepted encodings by the current connection.
- `accept_language(s)` &mdash; If singular, returns `true` if the connection accepts this language. As plural, will return all accepted languages by the current connection.
- `accept_type(s)` &mdash; If singular, returns `true` if the connection accepts this type. As plural, will return all accepted types by the current connection.

### Methods <var>mixin</var>

- `get_req_header(name[, defvalue])` &mdash; Return a single request header.
- `put_req_header(name, value)` &mdash; Set or update a request header.
- `delete_req_header(name)` &mdash; Remove request headers by `name`.

### Public methods <var>static</var>

- `$mixins()` &mdash; Request mixins to be exported through `ctx` object.

---

## Response

### Props <var>mixin</var>

- `has_body` &mdash; Returns `true` if the connection has a body defined.
- `has_status` &mdash; Returns `true` if the connection has an status defined.
- `content_type` &mdash; Current `content-type`, default to `text/html`.
- `status_code` &mdash; Current `ctx.res.statusCode`, default to `200`.
- `resp_body` &mdash; Current response body, `null` if none.
- `resp_charset` &mdash; Charset from the current connection, default to `utf8`.

### Methods <var>mixin</var>

- `resp_headers()` &mdash; Return all the response headers as an object.
- `get_resp_header(name)` &mdash; Return a single response header.
- `put_resp_header(name, value)` &mdash; Set or update a response header.
- `merge_resp_headers(headers)` &mdash; Extend response headers.
- `delete_resp_header(name)` &mdash; Remove a single response headers.
- `redirect(location[, timeout[, body]])` &mdash; Redirect to another resource. If `timeout` is given, a `<meta http-equiv="refresh">` will be sent, use `body` to append anything else in this case.
- `json(value)` &mdash; Send the given value as `application/json` and ends the connection.
- `send_file(entry[, mimeType])` &mdash; Send the given file as `binary/octet-stream`, use `mimeType` to setup a different MIME.
- `send([body])` &mdash; Finish the current connection. The `body` value can be an object, buffer or string otherwise.
- `end([code[, message]])` &mdash; End the current connection. The `code` should be a number, otherwise it will be treated as `message` value.

### Public methods <var>static</var>

- `$mixins()` &mdash; Response mixins to be exported through `ctx` object.
- `$before_render(ctx, template)` &mdash; Extend locals with `ctx.state` hook.

### Private* methods <var>static</var>

- `_finishRequest(ctx[, body])` &mdash; Normalize the input given by `ctx.send()` calls.
- `_endRequest(ctx, code[, message])` &mdash; Normalize the input given to `ctx.end()` calls.
- `_cutBody(value)` &mdash; Trim the value passed through `set_body` calls.
- `_fixURL(location)` &mdash; Normalize any given value into a valid URL string.
