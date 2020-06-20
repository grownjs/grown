module.exports = ({ env, pkg, body }) => `
  <!DOCTYPE html>
  <html class="no-js" lang="en">
    <head>
      <base href="/" />
      <meta charset="utf-8" />
      <meta http-equiv="x-ua-compatible" content="ie=edge" />
      <meta name="package" content="${pkg.name} v${pkg.version}" />
      <meta name="revision" content="${env.GIT_REVISION}" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Administration</title>
    </head>
    <body id="app">${body}</body>
    <script src="/assets/admin.bundle.js"></script>
  </html>
`;
