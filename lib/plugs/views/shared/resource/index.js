module.exports = locals => {
  if (locals.resource) {
    return `<script type="application/json" data-json-form>${JSON.stringify(locals.resource)}</script>`;
  }
};
