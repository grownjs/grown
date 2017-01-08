function leftpad(str, length) {
  return (str + (new Array(length + 1).join(' '))).substr(0, length);
}

export default ({ type, error, params, handler }) => {
  const handlerInfo = handler && {
    handler: `${handler.controller}#${handler.action}`,
    route: `${handler.route.verb.toUpperCase()} ${handler.route.path}`,
    alias: handler.route.as,
  };

  const maxLength = params && Object.keys(params)
    .map(p => p.length)
    .sort((a, b) => b - a)[0];

  return type === 'html'
    ? `${handler ? `<h3>${handlerInfo.handler}</h3>

<code>${handlerInfo.route}</code> as <b>${handlerInfo.alias}</b>`
: ''}

${params && Object.keys(params).length ?
  `<h4>Params</h4>
    <dl>${Object.keys(params).map(name =>
      `<dt>${name}</dt><dd>${params[name]}</dd>`
    ).join('\n')}</dl>`
: ''}

<h4>${error.name} <code>${error.call}</code></h4>

<details>
  <summary>${error.body.shift()}</summary>
  <pre>${(error.body.length ? `- ${error.body.join('\n- ')}\n` : '') + error.stack}</pre>
</details>`
    : `${handler ? `${handlerInfo.handler}
- ${handlerInfo.route} as ${handlerInfo.alias}`
: ''}
${params && Object.keys(params).length ?
  `${Object.keys(params).map(name =>
    `- ${leftpad(name, maxLength)}  ${params[name]}`).join('\n')}`
: ''}

${error.name} ${error.call}
- ${error.body.join('\n- ')}
${error.stack}`;
};
