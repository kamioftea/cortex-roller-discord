const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const uuid =  require('uuid');
const eventualDb = require('../db-conn')
const {authenticated} = require('../authenticateRequest');

const uploadPath = path.join(__dirname, '..', 'public', 'images', 'upload');

router.use(authenticated())

router.use((req, res, next) => {
    res.locals.base_url = req.baseUrl;
    next();
});

/* GET home page. */
router.get('/', async function (req, res) {
    const db = await eventualDb;
    if(!(req.user.roles || []).includes('Admin')){
        const characters = await db.collection('characters').find({_player_id: req.user._id})
        const campaigns = await db.collection('campaigns').find({_id: {$in:  characters.map(c => c.campaign_id)}})
        if(campaigns.length === 1) {
            return res.redirect(`${req.locals.base_url}/${campaigns[0].slug}`)
        }

        return res.render('index', {
            title:         'Tales of Xadia',
            user:          req.user,
            campaigns
        })
    }
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
