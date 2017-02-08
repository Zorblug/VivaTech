var debug = require('debug')('jcdecaux.remote.router');
var express = require('express');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  debug('REMOTE : config %s', JSON.stringify(req.app.locals.netConfig));
  res.render('remoteScreen', { title: 'Telecommande des Jeux', address:req.app.locals.netConfig.address.item('wlan0'), port:req.app.locals.netConfig.port });
});

var homeTriggerId = 152807906;  //Video
var loop1TriggerId =152807835;  //Cam360
var loop2TriggerId = 152807886; //Game

router.post('/home', function (req, res) {
    debug('TRIGGER : HOME');

    req.app.locals.brCtrl.stopLoopNFC();

    req.app.locals.brCtrl.pushTrigger(homeTriggerId);//VivaTech boucle
    req.app.locals.brCtrl.reArmPushNFC(0);

    //req.app.locals.brCtrl.loopNFC([109229290, 109229332, 109229365, 109229476]);//Deauville
    req.app.locals.brCtrl.resetNoCameraTrig();
    res.sendStatus(200);
});

router.post('/loop1', function (req, res) { //LOOP 1
    debug('TRIGGER : LOOP 1');

    req.app.locals.brCtrl.stopLoopNFC();

    req.app.locals.brCtrl.pushTrigger(loop1TriggerId);//Space Invaders
    req.app.locals.brCtrl.reArmPushNFC(0);

    //req.app.locals.brCtrl.loopNFC([109227455]);Deauville

    res.sendStatus(200);
});

router.post('/loop2', function (req, res) { //LOOP 2
    debug('TRIGGER : LOOP 2');

    req.app.locals.brCtrl.stopLoopNFC();

    //req.app.locals.brCtrl.loopNFC([106241726, 106377377, 106377385]);//Barcellone

    req.app.locals.brCtrl.pushTrigger(loop2TriggerId);//Domino
    req.app.locals.brCtrl.reArmPushNFC(0);

    //req.app.locals.brCtrl.loopNFC([109227458]);// Deauville

    res.sendStatus(200);
});

module.exports = router;
