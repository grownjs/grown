/* global RunKit, __runkit__ */

const activeLocation = location.pathname.replace(/\/$/, '') || '/';
const linkSelector = `#sidebar a[href$="${activeLocation}"]`;
const activeLink = document.querySelector(linkSelector);

let iframes;
function loadIframes() {
  const targets = document.querySelectorAll('[data-external]');
  iframes = [].slice.call(targets).reduce((memo, cur) => {
    cur.style.display = 'none';
    cur.dataset.label = 'ready';
    cur.innerHTML = `<iframe name="${cur.id}-external"></iframe>`;

    cur.firstChild.addEventListener('load', () => {
      cur.dataset.label = 'response';
    });

    memo[cur.id] = cur;
    return memo;
  }, {});
}

function targetLinks(baseURL, el) {
  [].slice.call(el.querySelectorAll('a>code')).forEach(node => {
    if (!node.dataset.href) node.dataset.href = node.parentNode.href.replace(location.origin, '');

    const [link, anchor] = node.dataset.href.split('#');
    const target = iframes[anchor || 'target'];

    target.style.display = 'block';
    node.parentNode.setAttribute('target', `${anchor || 'target'}-external`);
    node.parentNode.setAttribute('href', baseURL + link);
    node.parentNode.addEventListener('click', () => {
      target.dataset.label = '...';
    });
  });
}

const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const notebooks = [];

let theme = window.localStorage.theme || '';
function loadTheme() {
  notebooks.forEach(notebook => {
    notebook.setTheme(theme === 'dark' ? 'atom-dark' : 'atom-light');
  });
  document.documentElement.setAttribute('theme', theme);
  if (theme === (isDark ? 'dark' : 'light')) {
    delete window.localStorage.theme;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadIframes();
  window.toggle.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    window.localStorage.theme = theme;
    loadTheme();
  });

  window.onbeforeunload = () => {
    window.localStorage.sidebar = window.sidebar.scrollTop;
  };

  if (window.localStorage.sidebar) {
    window.sidebar.scrollTop = window.localStorage.sidebar;
  }
});

if (!theme) {
  if (isDark) {
    theme = 'dark';
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    theme = e.matches ? 'dark' : 'light';
    loadTheme();
  });
}
loadTheme();

const prelude = `
require('pug');
const s = require('tiny-dedent');
const fs = require('fs-extra');
const path = require('path');
const { strip } = require('ansicolor');

const toString = value => String(Buffer.from(value));
const normalizeText = msg => strip(msg.replace(/[\\r\\n\\b]/g, ''));

process.stdout.write = msg => console.log(normalizeText(toString(msg)));

global.fixture = (str, ...vars) => {
  const buffer = [];
  for (let i = 0; i < str.length; i += 1) {
    buffer.push(str[i], vars[i]);
  }
  const text = buffer.join('');
  const [file, ...result] = buffer.shift().split('\\n');
  fs.outputFileSync(file.replace(/^\\./, prefix || '.'), s(result.join('\\n')));
};

global.assert = require('assert');
global.Grown = require('@grown/bud')();

let prefix;
`;

[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(source => {
  if (!source.innerText.includes('Grown')) return;

  const next = source.parentNode.nextElementSibling;
  const isEndpoint = __runkit__.endpoint;
  const sourceCode = source.innerText;
  const a = document.createElement('a');

  a.innerText = '▷ RUN';
  a.href = location.href;
  a.addEventListener('click', e => {
    e.preventDefault();
    if (a._locked) return;
    a.innerText = '...';
    a._locked = true;
    delete a.onclick;

    const el = document.createElement('div');

    el.style.position = 'fixed';
    el.style.overflow = 'hidden';
    source.parentNode.parentNode.insertBefore(el, source.parentNode);

    const notebook = RunKit.createNotebook({
      element: el,
      source: sourceCode,
      theme: theme === 'dark' ? 'atom-dark' : 'atom-light',
      mode: isEndpoint && 'endpoint',
      title: __runkit__.title || 'Untitled',
      preamble: prelude + (__runkit__.preamble || '')
        + (isEndpoint ? '\nexports.endpoint=(req,res)=>{res.end()}' : ''),
      environment: [{ name: 'NODE_ENV', value: 'test' }],
      gutterStyle: 'none',
      evaluateOnLoad: true,
      onLoad: () => {
        source.parentNode.parentNode.removeChild(source.parentNode);
        el.style.position = 'static';
      },
      onURLChanged: () => notebook.getEndpointURL()
        .then(result => targetLinks(result, next)),
    });

    notebooks.push(notebook);
  });

  source.parentNode.appendChild(a);
  source.parentNode.className = 'fixed';
});

if (activeLink && activeLocation !== '/') {
  activeLink.scrollIntoView({
    block: 'end',
  });
}
