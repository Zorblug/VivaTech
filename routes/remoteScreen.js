var debug = require('debug')('domino.remote');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  debug('REMOTE : config %s', JSON.stringify(req.app.locals.netConfig));
  res.render('remoteScreen', { title: 'Telecommande des Jeux', address:req.app.locals.netConfig.address.item('wlan0'), port:req.app.locals.netConfig.port });
});

router.post('/home', function (req, res) {
    debug('TRIGGER : HOME');

    req.app.locals.brCtrl.stopLoopNFC();

    req.app.locals.brCtrl.pushTrigger(120708213);//VivaTech boucle
    req.app.locals.brCtrl.reArmPushNFC(0);

    //req.app.locals.brCtrl.loopNFC([109229290, 109229332, 109229365, 109229476]);//Deauville

    res.sendStatus(200);
});

router.post('/loop1', function (req, res) { //LOOP 1
    debug('TRIGGER : LOOP 1');

    req.app.locals.brCtrl.stopLoopNFC();

    req.app.locals.brCtrl.pushTrigger(120706783);//Space Invaders
    req.app.locals.brCtrl.reArmPushNFC(0);

    //req.app.locals.brCtrl.loopNFC([109227455]);Deauville

    res.sendStatus(200);
});

router.post('/loop2', function (req, res) { //LOOP 2
    debug('TRIGGER : LOOP 2');

    req.app.locals.brCtrl.stopLoopNFC();

    //req.app.locals.brCtrl.loopNFC([106241726, 106377377, 106377385]);//Barcellone

    req.app.locals.brCtrl.pushTrigger(120706979);//Domino
    req.app.locals.brCtrl.reArmPushNFC(0);

    //req.app.locals.brCtrl.loopNFC([109227458]);// Deauville

    res.sendStatus(200);
});

// router.post('/loop3', function (req, res) { // LOOP GAME
//     debug('TRIGGER : LOOP 3');
//
//     req.app.locals.brCtrl.stopLoopNFC();
//
//     req.app.locals.brCtrl.pushTrigger(106241727);//Barcellone
//     req.app.locals.brCtrl.reArmPushNFC(0);
//
//     res.sendStatus(200);
// });
//
// router.post('/loop4', function (req, res) { //LOOP 4
//     debug('TRIGGER : LOOP 4');
//
//     req.app.locals.brCtrl.stopLoopNFC();
//     req.app.locals.brCtrl.pushTrigger(106241731);//Barcellone
//     req.app.locals.brCtrl.reArmPushNFC(0);
//
//     res.sendStatus(200);
// });

module.exports = router;
