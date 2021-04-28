$(() => {
    // noinspection JSUnresolvedFunction
    $('.select2').select2();

    $('.submit-on-change').on(
        'change',
        e => {
            e.preventDefault();

            const $this = $(e.target)

            const formData = {[$this.prop('name')]: $this.val()};

            fetch(
                $this.data('href'),
                {
                    method: 'post',
                    body: JSON.stringify(formData),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: "same-origin"
                }
            )
                .then(res => res.json())
                .catch(err => {console.log(err); return {success: false}})
                .then(({success}) => {
                    const className = success ? 'success' : 'danger';
                    $this.addClass(className)
                    window.setTimeout(() => $this.removeClass(className), 2000)
                })
        }
    )
})
