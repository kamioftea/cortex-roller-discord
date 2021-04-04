const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const uuid =  require('uuid');

const {addScript} = require('../util');
const {authenticated} = require('../authenticateRequest');

const uploadPath = path.join(__dirname, '..', 'public', 'images', 'upload');

router.use(authenticated())

/* GET home page. */
router.get('/', async function (req, res) {
    addScript(res, '/javascripts/webpack-main.js');

    res.render('index', {
        title:         'Tales of Xadia',
        user:          req.user,
        websocket_url: process.env.WEBSOCKET_URL || 'ws://localhost:3000/listen',
    });
});

router.post(
    '/image-upload',
    authenticated('Admin'),
    async (req, res) => {
        const contentType = req.header('Content-Type');
        const [,extension] = contentType.match(/^image\/([a-z]+)$/i) || [];

        if(!extension)
        {
            return res.json({
                success: false,
                message: `Unexpected Content Type ${contentType}`
            });
        }

        const filename = `${uuid.v4()}.${extension}`;
        const filepath = path.join(uploadPath, filename);
        const url = `/images/upload/${filename}`;

        try {
            await fs.writeFile(filepath, req.body);
        }
        catch (err) {
            return res.json({
                success: false,
                message: err
            });
        }

        return res.json({
            success: true,
            url
        });
    }
);

module.exports = router;
