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
    addScript(res, script) {
        res.locals.scripts = [
            ...(res.locals.scripts || []),
            script,
        ];
    },
    filterObject(obj, predicate) {
        let entries = Object.entries(obj || {}).filter(([k, v]) => predicate(v, k));
        return entries.length > 0 ? Object.fromEntries(entries) : null;
    }
}
