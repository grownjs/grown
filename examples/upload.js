/* eslint-disable global-require */

const Homegrown = require('..')();

const $ = Homegrown.new();

$.use(require('..').plugs.upload());

$.listen(`${process.env.UWS > 0 ? 'uws' : 'http'}://0.0.0.0:5000`)
.then((app) => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));

$.mount((conn) => {
  if (conn.request_path === '/upload') {
    return conn.upload_files().then((result) => {
      conn.resp_body = result;
    });
  }

  if (conn.request_path === '/') {
    conn.resp_body = `<form method="post" enctype="multipart/form-data" action="/upload">
  <input type="file" name="f" multiple><input type="submit" name="ok">
</form>`;
  }
});
