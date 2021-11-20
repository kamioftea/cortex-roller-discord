const {eventualDb} = require('../db-conn.js');
const {writeMessage} = require('../flashMessage.js');

const reservedURLs = ['image-upload']

async function withCampaign(req, res, next) {
    const {campaignSlug} = req.params;

    if(reservedURLs.includes(campaignSlug)){
        return next();
    }

    const db = await eventualDb;
    const campaign = await db.collection('campaigns').findOne({slug: campaignSlug});

    if(!campaign) {
        writeMessage(req, 'Failed to find campaign', 'warning');
        return res.redirect('/')
    }

    res.locals.campaign = campaign;
    next();
}

module.exports = {
    withCampaign,
    reservedURLs
};
