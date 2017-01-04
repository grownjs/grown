import configure from './_api/configure';
import dispatch from './_api/dispatch';
import listen from './_api/listen';
import mount from './_api/mount';
import use from './_api/use';

import ctx from './_conn/ctx';
import host from './_conn/host';
import server from './_conn/server';

import factory from './_factory';
import pipeline from './_pipeline';

import test from './_plugs/test';
import logger from './_plugs/logger';
import models from './_plugs/models';
import render from './_plugs/render';
import router from './_plugs/router';
import upload from './_plugs/upload';

export default {
  bind: {
    configure,
    dispatch,
    listen,
    mount,
    use,
  },
  conn: {
    ctx,
    host,
    server,
  },
  chain: {
    factory,
    pipeline,
  },
  plugs: {
    test,
    logger,
    models,
    render,
    router,
    upload,
  },
};
