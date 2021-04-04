module.exports = (...args) => args.reduce(
    (acc, arg) => typeof arg === 'string' || typeof arg === 'number' ? acc + arg.toString() : acc,
    ''
);
