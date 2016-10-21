'use strict';

var debug = require('debug')('jcdecaux.camera.router');
var express = require('express');

var router = express.Router();

router.get('/', function (req, res) {
    debug('CAMERA config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('camera', { title: 'CAMERA',
      address:req.app.locals.netConfig.address.item('eth1'),
      addressRemote:req.app.locals.netConfig.address.item('wlan0'),
      port:req.app.locals.netConfig.port });
});

module.exports = router;