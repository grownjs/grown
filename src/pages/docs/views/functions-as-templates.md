---
title: FTW
$render: ../../../_layouts/default.pug
---

#### Functions as templates

Views are plain-old functions that receive data:

```js
// app/views/layouts/default.js

module.exports = locals => `<html>
  <head>
    <title>${locals.pageTiele || 'Untitled'}</title>
  </head>
  <body>${locals.yield}</body>
</html>`;
```

Values to render are mostly strings but they can be buffers or streams:

```js
const fs = require('fs');

module.exports = locals =>
  fs.createReadStream(locals.filePath);

// or
module.exports = locals => new Buffer('42');
```

Regular objects are rendered as JSON responses:

```js
module.exports = locals => ({
  status: 'ok',
  data: locals.userInput,
});
```

Promised values are resolved before they get finally rendered.
