/* global target, RunKit, __runkit__ */

const activeLocation = location.pathname.replace(/\/$/, '') || '/';
const linkSelector = `#sidebar a[href$="${activeLocation}"]`;
const activeLink = document.querySelector(linkSelector);

function links(baseURL) {
  if (typeof target === 'undefined') return;

  target.style.display = 'block';
  target.dataset.label = 'ready';
  target.innerHTML = '<iframe name="external"></iframe>';

  target.firstChild.addEventListener('load', () => {
    target.dataset.label = 'Response:';
  });

  [].slice.call(document.querySelectorAll('a>code')).forEach(node => {
    if (!node.dataset.href) node.dataset.href = node.parentNode.href.replace(location.origin, '');

    node.parentNode.setAttribute('target', 'external');
    node.parentNode.setAttribute('href', baseURL + node.dataset.href);
    node.parentNode.addEventListener('click', () => {
      target.dataset.label = 'Requesting...';
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
const fs = require('fs-extra');
const path = require('path');
function fixture(str, ...vars) {
  const buffer = [];
  for (let i = 0; i < str.length; i += 1) {
    buffer.push(str[i], vars[i]);
  }
  const text = buffer.join('');
  const [file, ...result] = buffer.shift().split('\\n');
  fs.outputFileSync(file.replace(/^\\./, prefix || '.'), result.join('\\n'));
}
assert = require('assert');
Grown = require('@grown/bud')();
let prefix;
`;

[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(source => {
  if (!source.innerText.includes('require(')) return;

  const isEndpoint = __runkit__.endpoint;
  const sourceCode = source.innerText;
  const a = document.createElement('a');

  a.innerText = '▷ RUN';
  a.href = location.href;
  a.onclick = e => {
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
      environment: [{ name: 'U_WEBSOCKETS_SKIP', value: 'true' }],
      gutterStyle: 'none',
      evaluateOnLoad: true,
      onLoad: () => {
        source.parentNode.parentNode.removeChild(source.parentNode);
        el.style.position = 'static';
      },
      onURLChanged: () => notebook.getEndpointURL().then(links),
    });

    notebooks.push(notebook);
  };

  source.parentNode.appendChild(a);
});

if (activeLink && activeLocation !== '/') {
  activeLink.scrollIntoView({
    block: 'end',
  });
}
