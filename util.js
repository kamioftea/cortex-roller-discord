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
        return Object.fromEntries(
            Object.entries(obj).filter(([k, v]) => predicate(v, k))
        )
    }
}
