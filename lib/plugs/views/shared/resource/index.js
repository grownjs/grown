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
      field.prop ? util.get(row, field.prop) || null : '-'
    }</td>`;
}

function body(res) {
  return res.$data.map(row => {
    return `<tr>${res.$uiFields.index.map(field => cell(field, row)).join('\n')}
      <td><a href="${res.$actions[res.$model].edit.url(row.id)}">EDIT</a></td>
    </tr>`;
  }).join('\n');
}

module.exports = locals => {
  if (!locals.resource) {
    return;
  }

  const message = locals.resource.$data
    ? `${locals.resource.$data.length} record${
      locals.resource.$data.length === 1 ? '' : 's'
    } ${
      locals.resource.$data.length === 1 ? 'was' : 'were'
    } found`
    : 'No records were found';

  return `<table class="resource">
    <thead>
      <tr>${locals.resource.$uiFields.index.map(head).join('\n')}
        <th></th></tr>
    </thead>
    <tbody>
    ${(locals.resource.$data && body(locals.resource)) || `<tr><td colspan="99">${message}</td></tr>`}
    </tbody>
  </table>
  <a href="${locals.resource.$actions[locals.resource.$model].new.path}">+ New ${locals.resource.$model}</a>
`;
};
