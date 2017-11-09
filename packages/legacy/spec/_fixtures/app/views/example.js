module.exports = locals => `TEXT(${locals.foo}${locals.bar || ''})`;
