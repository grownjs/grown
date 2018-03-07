[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(source => {
  const matches = source.innerText.match(/\/\*+\s*@runkit\s*(.+?)\s*\*+\//);
  if (!matches) return;
  const snippet = __runkit__[matches[1]] || __runkit__;
  const isEndpoint = snippet.endpoint;
  const sourceCode = source.innerText.replace(`${matches[0]}\n`, '');
  const a = document.createElement('a');
  a.innerText = '▾ Open in REPL';
  a.href = '#';
  a.onclick = e => {
    delete a.onclick;
    e.preventDefault();
    a.innerText = 'Loading...';
    const target = document.createElement('div');
    const notebook = RunKit.createNotebook({
      element: target,
      source: sourceCode,
      mode: isEndpoint && 'endpoint',
      title: snippet.title,
      preamble: snippet.preamble,
      onLoad(e) {
        target.style = 'display:block;overflow:hidden';
        source.parentNode.parentNode.removeChild(source.parentNode);
      },
    });
    target.style = 'display:none';
    source.parentNode.parentNode.insertBefore(target, source.parentNode);
  };
  source.parentNode.appendChild(a);
});
