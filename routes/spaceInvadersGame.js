var debug = require('debug')('jcdecaux.spaceinvaders.router');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    debug('PLAYER config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('remote', { title: 'PAD', address:req.app.locals.netConfig.address.item('wlan0'), port:req.app.locals.netConfig.port });
});

router.get('/view', function (req, res) {
    debug('GAME config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('spaceInvadersGame', { title: 'Rockets vs Aliens',
        address:req.app.locals.netConfig.address.item('eth1'),
    	addressRemote:req.app.locals.netConfig.address.item('wlan0'),
        port:req.app.locals.netConfig.port });
});

module.exports = router;
