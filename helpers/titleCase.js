module.exports = (a = '') => {
    return typeof a === 'string'
        ? a.substring(0, 1).toLocaleUpperCase() + a.substring(1).toLocaleLowerCase()
        : null;
};
