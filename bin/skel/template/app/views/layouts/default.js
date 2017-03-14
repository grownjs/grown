module.exports = locals => `<!doctype html>
<html>
  <head>
    <title>${locals.title || 'Untitled'}</title>
    <meta name="_csrf" content="${locals.csrf_token}">
  </head>
  <body>
    ${locals.yield || ''}
  </body>
</html>`;
