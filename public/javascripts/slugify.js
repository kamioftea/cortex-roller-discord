$(() => {
    const slugify = str => str.trim()
                              .toLocaleLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')

    document.querySelectorAll('[data-slug-for]')
            .forEach(target => {
                const {slugFor} = target.dataset;
                const source = document.querySelector(slugFor);

                const listener = () => target.value = slugify(source.value);

                source?.addEventListener('keyup', listener)
                source?.addEventListener('change', listener)
            });
})
