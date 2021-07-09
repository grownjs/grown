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
window.toggle.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  window.localStorage.theme = theme;
  loadTheme();
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

[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(source => {
  if (!source.innerText.includes('require(')) return;

  const isEndpoint = __runkit__.endpoint;
  const sourceCode = source.innerText;
  const a = document.createElement('a');

  a.innerText = '► RUN';
  a.href = location.href;
  a.onclick = e => {
    if (a._locked) return;

    a._locked = true;
    delete a.onclick;
    e.preventDefault();

    const el = document.createElement('div');

    el.style.position = 'fixed';
    el.style.overflow = 'hidden';
    source.parentNode.parentNode.insertBefore(el, source.parentNode);

    const prefix = 'try {';
    const suffix = '} catch (e) { console.error(e); }';
    const notebook = RunKit.createNotebook({
      element: el,
      source: sourceCode,
      theme: theme === 'dark' ? 'atom-dark' : 'atom-light',
      mode: isEndpoint && 'endpoint',
      title: __runkit__.title || 'Untitled',
      preamble: prefix + (__runkit__.preamble ? __runkit__.preamble.contents || '' : '')
        + (isEndpoint ? '\nexports.endpoint=(req,res)=>{res.end()}' : '') + suffix,
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

window.stork.register('docs', 'index.st', {
  minimumQueryLength: 2,
});
