module.exports = (attrs) => Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
