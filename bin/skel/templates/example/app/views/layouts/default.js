module.exports = locals => `<!doctype html>
<html>
  <head>
    <title>${locals.title || 'Untitled'}</title>
  </head>
  <body>
    <h1>It works!</h1>
    ${locals.yield || ''}
  </body>
</html>`;
