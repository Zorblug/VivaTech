var debug = require('debug')('jcdecaux.domino.router');
var express = require('express');

var router = express.Router();

router.get('/', function (req, res) {
    debug('PLAYER config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('dominoPlayer', { title: 'Domino PLAYER', address: req.app.locals.netConfig.address.item('wlan0'), port: req.app.locals.netConfig.port });
});

router.get('/view', function (req, res) {
    debug('TABLE config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('dominoGame', {
        title: 'Domino GAME',
        address: req.app.locals.netConfig.address.item('eth1'),
        addressRemote: req.app.locals.netConfig.address.item('wlan0'),
        port: req.app.locals.netConfig.port,
        woman: req.app.locals.infos.countWoman,
        man: req.app.locals.infos.countMan
    });
});

module.exports = router;
