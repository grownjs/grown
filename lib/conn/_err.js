'use strict';

function leftpad(str, length) {
  return (str + (new Array(length + 1).join(' '))).substr(0, length);
}

function renderHtml($, handlerInfo) {
  const handlerBlock = (YIELD) => `
    <h3>${handlerInfo.handler}</h3>
    <details>
      <summary><code>${handlerInfo.route}</code> as <b>${handlerInfo.alias}</b></summary>
      ${YIELD}
    </details>
  `;

  const errorBlock = (YIELD) => `
    <h4>${$.error.name} <code>${$.error.call.replace(/<=/g, '⇐')}</code></h4>

    <details>
      <summary>${$.error.debug ? $.error.debug.summary : $.error.body.shift()}</summary>
      <h5>Stack:</h5>
      <pre>${($.error.body.length ? `- ${$.error.body.join('\n- ')}\n` : '') + $.error.stack}</pre>
      ${YIELD}
    </details>
  `;

  const paramsBlock = () => `
    <dl>
      ${Object.keys($.params).map(name =>
        `<dt>${name}</dt><dd>${JSON.stringify($.params[name])}</dd>`).join('\n')}
    </dl>
  `;

  const errorsBlock = () => `
    <h5>Errors:</h5>
    <pre>${JSON.stringify($.error.errors, null, 2)}</pre>
  `;

  return {
    handlerBlock,
    paramsBlock,
    errorBlock,
    errorsBlock,
  };
}

function renderText($, handlerInfo) {
  const maxLength = $.params && Object.keys($.params)
    .map(p => p.length)
    .sort((a, b) => b - a)[0];

  const handlerBlock = (YIELD) =>
    [
      `> ${handlerInfo.handler}\n`,
      `- ${handlerInfo.route} as ${handlerInfo.alias}\n`,
      YIELD,
    ].join('');

  const paramsBlock = () =>
    Object.keys($.params).map(name =>
      `- ${leftpad(name, maxLength)}  ${JSON.stringify($.params[name])}`
    ).join('\n');

  const errorBlock = (YIELD) =>
    [
      `${$.error.name} ${$.error.call}\n`,
      $.error.debug ? `${$.error.debug.summary}\n` : '',
      `- ${$.error.body.join('\n- ')}\n`,
      YIELD,
    ].join('');

  const errorsBlock = () =>
    `\n${JSON.stringify($.error.errors, null, 2)}`;

  return {
    handlerBlock,
    paramsBlock,
    errorBlock,
    errorsBlock,
  };
}

module.exports = ($) => {
  const handlerInfo = $.handler && $.handler.route && {
    handler: `${$.handler.controller}#${$.handler.action}`,
    route: `${$.handler.route.verb.toUpperCase()} ${$.handler.route.path}`,
    alias: $.handler.route.as,
  };

  const hasParams = Object.keys($.params).length;
  const hasErrors = $.error.errors.length;

  const view = $.type === 'html'
    ? renderHtml($, handlerInfo)
    : renderText($, handlerInfo);

  const out = [];

  if (handlerInfo) {
    out.push(view.handlerBlock(hasParams ? view.paramsBlock() : ''));
    out.push(view.errorBlock(hasErrors ? view.errorsBlock() : ''));
  } else {
    out.push(view.errorBlock(hasParams ? view.paramsBlock() : ''));
    out.push(hasErrors ? view.errorsBlock() : '');
  }

  return out.join('');
};
