module.exports = ({
  env, pkg, base, body, title, scripts, styles,
}) => `
  <!DOCTYPE html>
  <html class="no-js" lang="en">
    <head>
      <base href="${base || '/'}" />
      <meta charset="utf-8" />
      <meta http-equiv="x-ua-compatible" content="ie=edge" />
      <meta name="description" content="${pkg.description}" />
      <meta name="package" content="${pkg.name} v${pkg.version}" />
      <meta name="revision" content="${env.GIT_REVISION}" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title || 'Administration'}</title>
      ${styles || ''}
    </head>
    <body id="app">${body || ''}</body>
    ${scripts || ''}
  </html>
`;
