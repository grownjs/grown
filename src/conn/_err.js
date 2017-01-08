function leftpad(str, length) {
  return (str + (new Array(length + 1).join(' '))).substr(0, length);
}

export default ({ type, error, params, handler }) => {
  const handlerInfo = handler && handler.route && {
    handler: `${handler.controller}#${handler.action}`,
    route: `${handler.route.verb.toUpperCase()} ${handler.route.path}`,
    alias: handler.route.as,
  };

  const maxLength = params && Object.keys(params)
    .map(p => p.length)
    .sort((a, b) => b - a)[0];

  return type === 'html'
    ? `${handlerInfo ? `<h3>${handlerInfo.handler}</h3>
<details>
  <summary><code>${handlerInfo.route}</code> as <b>${handlerInfo.alias}</b></summary>`
: ''}
${params && Object.keys(params).length ?
  `<dl>${Object.keys(params).map(name =>
      `<dt>${name}</dt><dd>${params[name]}</dd>`
    ).join('\n')}</dl></details>`
: '</details>'}
<h4>${error.name} <code>${error.call.replace(/<=/g, '⇐')}</code></h4>
<details>
  <summary>${error.body.shift()}</summary>
  <h5>Stack:</h5>
  <pre>${(error.body.length ? `- ${error.body.join('\n- ')}\n` : '') + error.stack}</pre>
  ${error.errors.length ?
    `<h5>Errors:</h5>
<pre>${JSON.stringify(error.errors, null, 2)}</pre>`
    : ''}
</details>`
    : `${handlerInfo ? `${handlerInfo.handler}
- ${handlerInfo.route} as ${handlerInfo.alias}`
: ''}
${params && Object.keys(params).length ?
  `${Object.keys(params).map(name =>
    `- ${leftpad(name, maxLength)}  ${params[name]}`).join('\n')}\n`
: ''}
${error.name} ${error.call}
- ${error.body.join('\n- ')}
${error.stack}${error.errors.length ?
  `\n\n${JSON.stringify(error.errors, null, 2)}`
  : ''}`;
};
