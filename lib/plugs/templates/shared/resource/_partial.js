module.exports = state => {
  if (state.resource) {
    return `<script type="application/json" data-component="jsonschema-form">${JSON.stringify(state.resource)}</script>`;
  }

  return '<p>Missing resource, verify your state.</p>';
};
