$(() => {
    $('[data-image-upload]').each(function () {
        const $this = $(this);

        const {
            imageUploadSource,
            imageUploadTrigger,
            imageUploadTarget,
            imageUploadClear,
            imageUploadUrl,
            imageUploadPrefix = '',
        } = $this.data();

        const $source = $(`#${imageUploadSource}`);
        const $trigger = $(`#${imageUploadTrigger}`);
        const $target = $(`${imageUploadTarget}`);
        const $clear = $(`#${imageUploadClear}`);

        const $trigger_icon = $trigger.find('.far');

        if($target.val())
        {
            $this.css('background-image', `url(${$target.val()})`)
        }
        else
        {
            $clear.hide()
        }

        $target.on('change', () => {
            $this.css('background-image', `url(${$target.val()})`);
            $target.val() ? $clear.show() : $clear.hide();
        })

        $target.on('paste', e => {
            let paste = (e.clipboardData || e.originalEvent.clipboardData || window.clipboardData);

            for(let item of paste.items) {
                if(item.type.match(/^image\/(png|jpg|jpeg|gif)/))
                {
                    e.preventDefault();
                    uploadFile(item.getAsFile());
                    return;
                }
            }
        });

        function uploadFile(file) {
            $trigger.addClass('disabled');
            $trigger_icon.addClass('fa-spinner fa-spin');

            fetch(
                imageUploadUrl,
                {
                    method:      'POST',
                    credentials: 'same-origin',
                    body:        file
                }
            )
                .then(res => res.json())
                .then(({success, url, message}) => {
                    if (!success) {
                        throw new Error(message);
                    }
                    const fullUrl = imageUploadPrefix + url;

                    $this.css('background-color', '');
                    $this.css('background-image', `url(${fullUrl})`);
                    $target.val(fullUrl);
                })
                .catch(err => {
                    console.log(err);
                    $target.val('');
                    $this.css('background-image', '');
                    $clear.hide();
                    $this.css('background-color', '#f5ab9f');
                })
                .finally(() => {
                    $trigger.removeClass('disabled');
                    $trigger_icon.removeClass('fa-spinner fa-spin');
                })
        }

        $source.on('change', e => {
            e.preventDefault();
            uploadFile(e.target.files[0]);
        });

        $clear.on('click', e => {
            e.preventDefault();
            $target.val('');
            $this.css('background-image', '');
            $clear.hide();
            $this.css('background-color', '');
        })
    });
});
