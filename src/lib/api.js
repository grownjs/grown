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
};
