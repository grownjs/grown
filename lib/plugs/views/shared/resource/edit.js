module.exports = locals => {
  if (locals.resource) {
    return `<script type="application/json" data-component="jsonschema-form">${JSON.stringify(locals.resource)}</script>`;
  }
};
