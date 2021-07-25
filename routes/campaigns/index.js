const express = require('express');
const router = express.Router();
const {eventualDb} = require('../../db-conn.js');
const {authenticated, hasRole} = require('../../authenticateRequest.js');
const {writeMessage} = require('../../flashMessage.js');
const {addScript} = require('../../util');

router.use(authenticated());

router.use((req, res, next) => {
    res.locals.base_url = req.baseUrl;
    next();
});

/* GET character list page. */
router.get('/', async function (req, res) {
    const db = await eventualDb;

    const query = hasRole(req, 'Admin')
        ? {}
        : {[`users.${req.user._id}`]: {$exists: true}}

    const user_data = await db.collection('users').find().toArray();
    const users = Object.fromEntries(user_data.map(({_id, name}) => [_id, name]));
    const lookupNarrator = (obj = {}) =>
        Object.entries(obj)
              .filter(([_id, roles]) => roles.includes('Narrator') && users[_id])
              .map(([_id]) => users[_id])
              .join(', ');

    const campaign_data = await db.collection('campaigns').find(query)
                                  .sort({title: 1})
                                  .toArray();

    const campaigns = campaign_data.map(c => ({...c, narrator: lookupNarrator(c.users)}));

    res.render(
        'campaigns/list',
        {
            title: 'Campaign List',
            campaigns,
        }
    );
});

router.get(
    '/add',
    (req, res) => {
        const url_prefix = 'https://' + req.get('host');
        addScript(res, '/javascripts/image-upload.js');
        addScript(res, '/javascripts/slugify.js');

        res.render(
            'campaigns/form',
            {
                title: 'Add Campaign',
                url_prefix,
            }
        );
    }
)

router.post(
    '/add',
    async (req, res) => {
        const {
            title,
            slug,
            icon_url,
            banner_url,
            description,
        } = req.body;

        const users = {
            [req.user._id]: ['Narrator']
        }

        if (title) {
            const db = await eventualDb;

            try {
                await db.collection('campaigns').insertOne({
                    title,
                    slug,
                    icon_url,
                    banner_url,
                    description,
                    users
                })
                res.redirect(req.baseUrl)
            }
            catch (err) {
                writeMessage(req, err.message, 'alert');
                res.redirect(req.originalUrl)
            }
        }
        else {
            writeMessage(req, 'Title must be provided', 'alert');
            res.redirect(req.originalUrl)
        }

    }
)

module.exports = router;
