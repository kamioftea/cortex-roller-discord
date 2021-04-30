$(() => {
    $('.set-field-button').on('click', function (e) {
        e.preventDefault();

        const $this = $(this);
        const {field, value} = $this.data();

        $(`[name=${field}]`).val(value).trigger('change');
    })
})
