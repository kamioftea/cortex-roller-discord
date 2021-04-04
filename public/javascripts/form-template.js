$(() => {
    $(document).on('click', '[data-template]', (e) => {
        e.preventDefault();
        const $this = $(e.currentTarget);
        const dataset = {...$this.data()};
        const template_html = $(`#${dataset.template}`).html()
        const $target = $(`#${dataset.target}`);

        const index = $target.find('[data-index]').toArray().reduce(
            (acc, elem) => Math.max(parseInt(elem.dataset.index) + 1, acc),
            0
        );

        const lookup = {...dataset, index};

        const html = template_html.replaceAll(
            /__([a-z0-9]+)__/gi,
            (_,key) => {
                console.log(key, lookup[key])
                return lookup[key];
            }
        );

        $target.append($(html));
    });

    $(document).on('click', '[data-template-remove]', (e) => {
        e.preventDefault();
        $(e.currentTarget).closest('[data-template-remove-target]').remove();
    });
})
