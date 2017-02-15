require('debug').enable('homegrown,homegrown:*');

require(`./${process.argv.slice(2)[0]}`);
