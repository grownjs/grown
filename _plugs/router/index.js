'use strict';

module.exports = ($, util, onError) => {
  require('./core')($, util, onError);
  require('./http')($, util, onError);
};

// FIXME: split all this (router.js) into submodules, grouped by funcionality to be
// composed later, e.g. middlewares, pipelines, render-fallback, repl, etc.
//
// server.plug(Grown.Router.HTTP)
//    this provides low-level routing, e.g. get() post() etc.

// server.plug(Grown.Router.REPL)
//    enable REPL support and such

// server.plug(Grown.Router.Views)
//    enable view() as fallback

// server.plug(Grown.Router.Routes)
//    load mappings from routes.js files

// server.plug(Grown.Router.Pipeline)
//    enable pipeline support (only props)

// server.plug(Grown.Router.Middleware)
//    enable middleware support (load, props)
