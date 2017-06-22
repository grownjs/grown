const util = require('../../../../util');

function head(field) {
  return `<th${field.className
    ? ` class="${field.className}"`
    : ''}>${field.title || field.prop}</th>`;
}

function cell(field, row) {
  return `<td${field.className
    ? ` class="${field.className}"`
    : ''} data-prop="${field.title || field.prop}">${
      field.prop ? util.get(row, field.prop) : '-'
    }</td>`;
}

function body(res) {
  return res.$data.map(row => {
    return `<tr>${res.$uiFields.map(field => cell(field, row)).join('\n')}
      <td><a href="${res.$actions[res.$model].edit.url(row.id)}">EDIT</a></td>
    </tr>`;
  }).join('\n');
}

module.exports = locals => {
  if (!locals.resource) {
    return;
  }

  return `<table class="resource">
    <thead>
      <tr>${locals.resource.$uiFields.map(head).join('\n')}
        <th></th></tr>
    </thead>
    <tbody>
    ${locals.resource.$data
      ? body(locals.resource)
      : ''}
    </tbody>
  </table>
  <a href="${locals.resource.$actions[locals.resource.$model].new.path}">+ New ${locals.resource.$model}</a>
`;
};
