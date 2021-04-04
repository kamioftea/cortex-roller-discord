const {handlebars} = require('hbs');

module.exports = (items, options) => {
    const {value = 'value', label = 'label', selected} = options.hash;

    if(!Array.isArray(items)) {
        throw new Error('Options helper: First argument should be an array of options.')
    }

    const html = items
        .map(
            item => {
                const itemValue = handlebars.escapeExpression(item[value]);
                const itemSelected = itemValue === `${selected}` ? 'selected="selected"' : '';
                const itemLabel = handlebars.escapeExpression(item[label]);

                return `<option value="${itemValue}" ${itemSelected}>${itemLabel}</option>`;
            }
        )
        .join("\n");

    return new handlebars.SafeString(html);
}
