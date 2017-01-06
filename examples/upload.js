const $ = require('..').new();

$.ctx.use(require('..').plugs.upload());

$.ctx.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});

$.ctx.mount((conn) => {
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
