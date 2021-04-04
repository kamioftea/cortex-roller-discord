$(() => {
    let onClear = null;
    let timeout = null;
    const clear = () => {
        if(timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        if(typeof onClear === 'function') {
            onClear();
            onClear = null;
        }
    }

    $('[data-update-url]').on('change', e => {
        clear();

        fetch(
            e.target.dataset.updateUrl,
            {
                method:  'post',
                headers: {'Content-Type': 'application/json'},
                body:    JSON.stringify({[e.target.name]: e.target.value})
            }
        )
            .then(res => res.json())
            .then(({success, error}) => {
                const $label = $(e.target).closest('label');
                let icon, labelClass, $after;
                if(success) {
                    labelClass = 'text-success';
                    icon = 'fa-check';
                }
                else {
                    labelClass = 'text-alert';
                    icon = 'fa-times';
                }

                const $icon = $(`<i class="far ${icon}" />`);
                $label.addClass(labelClass).prepend($icon);

                if(!success && error) {
                    $after = $(`<span>${error}</span>`)
                    $label.append($after);
                }

                onClear = () => {
                    $icon.remove();
                    $label.removeClass(labelClass);
                    if($after) {
                        $after.remove();
                    }
                }

                timeout = setTimeout(clear, 2000);
            });
    });
});
