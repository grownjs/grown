'use strict';

// TODO: all non-enumerable methods can be safely skipped

function safe(value) {
  if (typeof value === 'function') {
    const matches = value.toString()
      .match(/^(?:function)?\s*(.*)\((.*?)\)\s*(?:=>)?\s*\{/);

    if (!matches) {
      return value;
    }

    return `${matches[1]}(${matches[2]})`;
  }

  try {
    return JSON.stringify(value);
  } catch (e) {
    return `${e.message} (${value})`;
  }
}

function leftpad(str, length) {
  return (str + (new Array(length + 1).join(' '))).substr(0, length);
}

function renderHtml($, handlerInfo) {
  const handlerBlock = YIELD => `
    <h3>${handlerInfo.handler}</h3>
    <details>
      <summary><code>${handlerInfo.route}</code> as <b>${handlerInfo.alias}</b></summary>
      ${YIELD}
    </details>
  `;

  const errorBlock = YIELD => `
    <h4>${$.error.name} <code>${$.error.call.replace(/<=/g, '⇐')}</code></h4>
    <details>
      <summary>${($.error.debug && $.error.debug.summary) || $.error.message}</summary>
      <h5>Stack:</h5>
      <pre>${$.error.stack}</pre>
      ${YIELD}
    </details>
    ${$.error.debug && $.error.debug.message
      ? `<pre>${$.error.debug.message}</pre>`
      : ''}
  `;

  const paramsBlock = data => `
    <dl>
      ${Object.keys(data).map(name =>
        `<dt>${name}</dt><dd>${safe(data[name])}</dd>`).join('\n')}
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
  const handlerBlock = YIELD =>
    [
      `> ${handlerInfo.handler}\n`,
      `- ${handlerInfo.route} as ${handlerInfo.alias}\n`,
      YIELD,
    ].join('');

  const paramsBlock = (data, maxLength) =>
    Object.keys(data).map(name =>
      `- ${leftpad(name, maxLength)}  ${safe(data[name])}`
    ).join('\n');

  const errorBlock = YIELD =>
    [
      `${$.error.name} ${$.error.call}\n`,
      `${($.error.debug && $.error.debug.summary) || $.error.message}\n`,
      $.error.debug && $.error.debug.message ? `${$.error.debug.message}\n` : '',
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

module.exports = $ => {
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

  let text = '';

  const _data = data => {
    const maxLength = data && Object.keys(data)
      .map(p => p.length)
      .sort((a, b) => b - a)[0];

    return view.paramsBlock(data, maxLength);
  };

  if (handlerInfo) {
    text += view.handlerBlock(hasParams ? _data($.params) : '');
    text += view.errorBlock(hasErrors ? view.errorsBlock() : '');
  } else {
    text += view.errorBlock(hasParams ? _data($.params) : '');
    text += hasErrors ? view.errorsBlock() : '';
  }

  /* istanbul ignore else */
  if ($.error.debug && $.error.debug.data) {
    text += Object.keys($.error.debug.data).length ? _data($.error.debug.data) : '';
  }

  return text;
};
