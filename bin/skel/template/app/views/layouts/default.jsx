export default (locals, h) => <html>
  <head>
    <title>{locals.title || 'Untitled'}</title>
    <meta name="_csrf" content={locals.csrf_token}/>
  </head>
  <body>
    {locals.yield || ''}
    <script src='javascripts/application.js'></script>
  </body>
</html>
