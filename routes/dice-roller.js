const {authenticated} = require('../authenticateRequest');
const {addScript} = require('../util');
const {eventualDb} = require('../db-conn')

module.exports = router => {
    router.use(authenticated())
    router.use(async (req, res, next) => {
        const db = await eventualDb;

        const campaign = res.locals.campaign;
        if(!campaign) {
            return next()
        }

        if (!req.user.roles?.includes('Admin')) {
            const character= await db.collection('characters')
                                      .findOne({
                                          campaign_id: campaign._id,
                                          _player_id:  req.user._id
                                      })
            if (character === null) {
                res.status(403);
                return res.render('auth/forbidden', {title: 'Forbidden'});
            }
        }

        addScript(res, '/javascripts/webpack-main.js');

        res.render('dice-roller', {
            title:         'Tales of Xadia',
            user:          req.user,
            campaign,
            websocket_url: (process.env.WEBSOCKET_URL || 'ws://localhost:3000/listen') + '/' + campaign._id,
        });
    })
}
