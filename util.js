module.exports = {
    getRandomInt (max) {
        return Math.floor(Math.random() * Math.floor(max)) + 1;
    },
    partitionArray(array = [], predicate) {
        return array.reduce(
            ([pass, fail], item) =>
                predicate(item) ? [pass.concat([item]), fail] : [pass, fail.concat([item])]
            ,
            [[], []]
        )
    },
    addStyle(res, style) {
        res.locals.styles = [
            ...(res.locals.styles || []),
            typeof style === 'string' ? {href: style, rel: 'stylesheet'} : style,
        ];
    },
    addScript(res, script) {
        res.locals.scripts = [
            ...(res.locals.scripts || []),
            typeof script === 'string' ? {src: script} : script,
        ];
    },
    filterObject(obj, predicate) {
        let entries = Object.entries(obj || {}).filter(([k, v]) => predicate(v, k));
        return entries.length > 0 ? Object.fromEntries(entries) : null;
    },
    diceOptions: [
        {value: 4, label: 'D4'},
        {value: 6, label: 'D6'},
        {value: 8, label: 'D8'},
        {value: 10, label: 'D10'},
        {value: 12, label: 'D12'},
    ],
}
