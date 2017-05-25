---
title: FTW
$render: ../../_layouts/default.pug
---

### Controllers

Routes are the way to go, then you can take control.

#### Routing

Route mappings are defined in the `config/routes.js` file:

```js
module.exports = map =>
  map()
    .get('/', 'Home#index', { as: 'root' });
```

Each time you call a `map()` factory you can pass values and they will be inherited down.

#### Definition

Controllers can be plain-old javascript objects.

```js
// app/controllers/Home.js

module.exports = {
  methods: {
    index() {}
  },
};
```
By the mere fact of being declared, the render plug will try to render a `Home/index` view.

#### End responses

Any method receives the connection object, in turn it can responds or return a string,
buffer, stream or promise:

```js
index(conn) {
  conn.resp_body = '42';
  // return '42';
  // return new Buffer('42');
  // return Promise.resolve('42');
  // return conn.end('42').then(...);
}
```

Call `put_status()` to set a proper status code:

```js
conn.put_status(400);
conn.resp_body = {
  status: 'error',
  message: 'Invalid input',
};
```

#### Testing actions

Doing assertions on your controllers' responses is easy peasy.

```coffee
# spec/pages-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'web pages', ->
  beforeEach Grown.test(app)

  it 'not all pages exists', (done) ->
    @server.fetch('/x').then (resp) ->
      expect(resp.body).toContain('Not Found')
      done()

  it 'but the homepage yes!', (done) ->
    @server.fetch('/').then (resp) ->
      expect(resp.body).toContain('It works!')
      done()
```

Run your tests with `yarn spec` or `npm run spec` and see the results.

#### Interactive mode (fetch)

On the REPL you can `.fetch` resources too.

Examples:

```bash
.fetch POST /account --json username=foo
.fetch destroyAccount
.fetch showLogin
.fetch ...
```

To list all available routes just type `.routes` and hit ENTER.

Try `.routes <something>` to filter out matching routes.

- [back](/)
- [next](/docs/models)
