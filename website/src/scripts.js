/* global RunKit, __runkit__ */
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
    const target = document.createElement('div');
    source.parentNode.parentNode.insertBefore(target, source.parentNode);
    source.parentNode.parentNode.removeChild(source.parentNode);
    RunKit.createNotebook({
      element: target,
      source: sourceCode,
      mode: isEndpoint && 'endpoint',
      title: snippet.title || 'Untitled',
      preamble: snippet.preamble,
      gutterStyle: 'none',
      evaluateOnLoad: true,
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
