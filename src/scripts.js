[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(source => {
  const isEndpoint = /\b\w+\.listen\b/.test(source.innerText);
  const a = document.createElement('a');
  a.innerText = `${isEndpoint ? 'Open' : 'Load'} in REPL`;
  a.href = '#';
  a.onclick = e => {
    delete a.onclick;
    e.preventDefault();
    a.innerText = 'Loading...';
    const target = document.createElement('div');
    const notebook = RunKit.createNotebook({
      element: target,
      source: source.innerText,
      mode: isEndpoint && 'endpoint',
      onLoad(e) {
        source.parentNode.removeChild(a);
        target.style = 'display:block;overflow:hidden';
        source.parentNode.parentNode.removeChild(source.parentNode);
      },
    });
    target.style = 'display:none';
    source.parentNode.parentNode.insertBefore(target, source.parentNode);
  };
  source.parentNode.appendChild(a);
});
