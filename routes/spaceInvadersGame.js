var debug = require('debug')('domino.spacerouter');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    debug('PLAYER config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('remote', { title: 'PAD', address:req.app.locals.netConfig.address.item('wlan0'), port:req.app.locals.netConfig.port });
});

router.get('/view', function (req, res) {
    debug('GAME config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('spaceInvadersGame', { title: 'Rocket vs Aliens', address:req.app.locals.netConfig.address.item('eth1'), port:req.app.locals.netConfig.port });
});

module.exports = router;