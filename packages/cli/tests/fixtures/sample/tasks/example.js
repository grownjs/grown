'use strict';

const USAGE_INFO = `

  This line will be shown as summary

  And this description is shown when --help is given.

`;

module.exports = {
  description: USAGE_INFO,
  callback: () => console.log('OSOM'),
};
