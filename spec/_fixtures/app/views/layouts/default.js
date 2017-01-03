module.exports = (locals) => `
<!doctype html>
<html>
  <body>
    <p>${locals.index}</p>
    <footer>Done in {elapsed}</footer>
  </body>
</html>
`;
