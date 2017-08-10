module.exports = state => {
  if (state.resource) {
    return `<script type="application/json" data-component="jsonschema-form">${JSON.stringify(state.resource)}</script>`;
  }
};
