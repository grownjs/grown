/* global target, RunKit, __runkit__ */
function links(baseURL) {
  if (typeof target === 'undefined') return;
  target.style.display = 'block';
  [].slice.call(document.querySelectorAll('a>code')).forEach(node => {
    if (!node.dataset.href) node.dataset.href = node.parentNode.href.replace(location.origin, '');
    node.parentNode.setAttribute('target', 'external');
    node.parentNode.setAttribute('href', baseURL + node.dataset.href);
  });
}
[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(source => {
  const matches = source.innerText.match(/\/\*+\s*@runkit\s*(.+?)\s*\*+\//);
  if (!matches) return;
  const snippet = __runkit__[matches[1]] || __runkit__;
  const isEndpoint = snippet.endpoint;
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
    source.parentNode.parentNode.insertBefore(el, source.parentNode);
    source.parentNode.parentNode.removeChild(source.parentNode);
    const notebook = RunKit.createNotebook({
      element: el,
      source: sourceCode,
      mode: isEndpoint && 'endpoint',
      title: snippet.title || 'Untitled',
      preamble: snippet.preamble
        + (isEndpoint ? '\nexports.endpoint=(req,res)=>{res.end()}' : ''),
      environment: [{ name: 'U_WEBSOCKETS_SKIP', value: 'true' }],
      gutterStyle: 'none',
      evaluateOnLoad: true,
      onURLChanged: () => notebook.getEndpointURL().then(links),
    });
  };
  source.parentNode.appendChild(a);
});

const activeLocation = location.pathname.replace(/\/$/, '') || '/';
const linkSelector = `#sidebar a[href$="${activeLocation}"]`;
const activeLink = document.querySelector(linkSelector);

if (activeLink && activeLocation !== '/') {
  activeLink.scrollIntoView({
    block: 'end',
  });
}
