const {handlebars} = require('hbs');

module.exports = (items, options) => {
    const {value = 'value', label = 'label', selected} = options.hash;

    if(!Array.isArray(items)) {
        throw new Error('Options helper: First argument should be an array of options.')
    }

    // cast to array, force into strings, exclude empty values
    const selectedArray =
        (Array.isArray(selected) ? selected : [selected])
            .flatMap(v => v ? [`${v}`] : []);

    const html = items
        .map(
            item => {
                const itemValue = handlebars.escapeExpression(item[value]);
                const itemSelected = selectedArray.includes(itemValue) ? 'selected="selected"' : '';
                const itemLabel = item[label];

                return `<option value="${itemValue}" ${itemSelected}>${itemLabel}</option>`;
            }
        )
        .join("\n");

    return new handlebars.SafeString(html);
}
