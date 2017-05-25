---
title: FTW
$render: ../../_layouts/default.pug
---

### Initialization

Run `grown new . -y` to start a new project interactively.

Or you can specify each prese on the command line, e.g.

```bash
$ grown new . ES6=buble BUNDLER=rollup STYLES=less DATABASE=sqlite
```

The directory structure resembles a well-known pattern:


```bash
├── app
│   ├── assets
│   │   ├── images
│   │   ├── sprites
│   │   ├── javascripts
│   │   └── stylesheets
│   ├── controllers
│   ├── models
│   └── views
│       ├── shared
│       └── layouts
├── bin
├── boot
│   └── middlewares
├── build
├── config
├── lib
│   └── tasks
├── log
├── public
└── tmp
```

- [back](/)
- [next](/docs/interactive-mode)
