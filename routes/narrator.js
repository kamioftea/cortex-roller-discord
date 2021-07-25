const express = require('express');
const router = express.Router();

const {addScript} = require('../util');
const {authenticated} = require('../authenticateRequest');

router.use(authenticated('Admin'))

/* GET home page. */
router.get('/', async function (req, res) {
    addScript(res, '/javascripts/webpack-narrator.js');

    res.render('narrator/index', {
        title:         'Narrator Screen',
        user:          req.user,
        websocket_url: process.env.WEBSOCKET_URL || 'ws://localhost:3000/listen',
    });
});

module.exports = router;
