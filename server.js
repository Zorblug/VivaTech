'use strict'
/* Serveur de gestion Broadsign NFC gaming et reconaissance de visage
  # Variables d'environnement :
  DEBUG
    niveau d'afficha du debug
  YUN_MODE
   si definie alors mode YUN sinon mode bouchon
  PORT
    { port TCP pour le serveur HTTP express (defaut 3000) }
  CAM_PORT
    { port de communication serie vers la camera OMRON }
  BROADSIGN_IP
    { adresse ip du player broadsign }
  NFC_PORT
    { port communication ver sdispoistif NFC }
  NODE_ENV
    development
    production
*/
var debug = require('debug')('jcdecaux.server');
var http = require('http');
var os = require('os');

var app = require('./app.js');

var attachWebSockets = require('./lib/web-sockets');
var CameraService = require('./lib/cameraService');
var Collection = require('./common/collection');
var DominoGameServer = require('./lib/dominosServerControl');
var VirtualJoystickServer = require('./lib/virtualJoystickServer');

var camera = CameraService.getInstance();
var httpServer = http.createServer(app);
attachWebSockets(httpServer);

var serverIPaddress = new Collection();

var cameraPort = process.env.CAM_PORT || undefined;

if (process.env.BROADSIGN_IP) {
  // var broadsignControl = require('./lib/broadsign.js');
  // broadsignControl.setPlayerAddress(process.env.BROADSIGN_IP || '10.210.106.129');

  // app.locals.brCtrl = {
  //   pushNFC: broadsignControl.pushNFC,
  //   reArmPushNFC: broadsignControl.reArmPushNFC,
  //   pushTrigger: broadsignControl.pushTrigger,
  //   loopNFC: broadsignControl.loopNFC,
  //   stopLoopNFC: broadsignControl.stopLoopNFC
  // };
  if (process.env.NFC_PORT) {
    var Broadsign = require('./common/broadSignNFC');

    var manager = new Broadsign.Manager(process.env.BROADSIGN_IP, process.env.NFC_PORT);
    manager.open();
    manager.rearmNFC();

    app.locals.brCtrl = {
      pushNFC: manager.pushNFC.bind(manager),
      reArmPushNFC: manager.rearmNFC.bind(manager),
      pushTrigger: manager.pushTrigger.bind(manager),
      loopNFC: manager.startLoop.bind(manager),
      stopLoopNFC: manager.stopLoop.bind(manager)
    };
  }
  else {
    var Broadsign = require('./common/broadSign');

    var manager = new Broadsign.Request(process.env.BROADSIGN_IP);

    app.locals.brCtrl = {
      pushNFC: function () { },
      reArmPushNFC: function () { },
      pushTrigger: manager.pushTrigger.bind(manager),
      loopNFC: function () { },
      stopLoopNFC: function () { }
    };
  }
}
else {
  app.locals.brCtrl = {
    pushNFC: function () { },
    reArmPushNFC: function () { },
    pushTrigger: function () { },
    loopNFC: function () { },
    stopLoopNFC: function () { }
  };
}

if (process.env.YUN_MODE) {
  // Version YUN  
  var networkInterfaces = os.networkInterfaces();
  debug('NET ', networkInterfaces);

  for (var i in networkInterfaces) {
    var subNet = networkInterfaces[i];
    debug('SUB NET ' + i + ' : ' + JSON.stringify(subNet));
    for (var j in subNet) {
      debug('NET LIST -> ' + j + ' : ' + JSON.stringify(subNet[j]));
      if ((subNet[j].family == 'IPv4') && (subNet[j].internal == false)) {
        debug('NET ADD -> ' + i + ' : ' + subNet[j].address);
        serverIPaddress.add(i, subNet[j].address);
      }
    }
  }
}
else {
  //Version Bouchon
  serverIPaddress.add('wlan0', '192.168.137.1');
  serverIPaddress.add('eth1', '172.21.254.62');
}

app.locals.brCtrl.resetNoCameraTrig = ResetNoCameraTrig;
app.locals.netConfig = {
  address: serverIPaddress,
  port: app.settings.port
};

app.locals.infos = {
  countMan: 0,
  countWoman: 0
}

var noCameraTrig = false;
var noCameraTrigTimeout = undefined;
var cameraFlux = attachWebSockets.io.of('/camera');
var peoplePresent = false;
var countForSpaceInvaders = 0;
var countForDominos = 0;
var sending = true;

var mainLoopTriggerId = 152807906;
var spaceGameTriggerId = 152807886;
// var camera360TriggerId =152807835;
var dominoGameTriggerId = 132338871;

var dominosGameServer = new DominoGameServer(attachWebSockets.io, 45, 30);
dominosGameServer.init();
dominosGameServer.Events.on('close', function (param) {
  debug('END OF GAME DOMINOS EVENTS', param);
  setTimeout(function () {
    app.locals.brCtrl.pushTrigger(mainLoopTriggerId);
    app.locals.brCtrl.reArmPushNFC(0);
    ResetNoCameraTrig();
  }, 10000);
});
dominosGameServer.Events.on('init', function () {
  debug('START GAME DOMINOS EVENTS');
  setNoCameraTrig();
});

var serverJoystick = new VirtualJoystickServer(attachWebSockets.io, 45);
serverJoystick.init();
serverJoystick.Events.on('close_game', function () {
  debug('CLOSE GAME SPACE INVADERS EVENTS');
  app.locals.brCtrl.pushTrigger(mainLoopTriggerId);
  app.locals.brCtrl.reArmPushNFC(0);
  ResetNoCameraTrig();
});
serverJoystick.Events.on('start_game', function () {
  debug('START GAME SPACE INVADERS EVENTS');
  setNoCameraTrig();
});

function ResetNoCameraTrig() {
  if (noCameraTrig) {
    noCameraTrig = false;
    if (noCameraTrigTimeout) {
      clearTimeout(noCameraTrigTimeout);
      noCameraTrigTimeout = undefined;
    }
  }
}

function setNoCameraTrig() {
  if (!noCameraTrig) {
    noCameraTrig = true;
    noCameraTrigTimeout = setTimeout(ResetNoCameraTrig, 1200000);
  }
}

function CameraCallback(answer) {
  var infos = CameraService.buildInfosResult(answer);
  debug('Detection : ' + JSON.stringify(infos));
  app.locals.infos.countMan = 0;
  app.locals.infos.countWoman = 0;
  if (infos.count > 0) {
    sending = true;
    peoplePresent = true;
    for (var idx = 0; idx < infos.list.length; idx++) {
      if (infos.list[idx].gender.code === 0) {
        app.locals.infos.countWoman++;
      }
      else {
        app.locals.infos.countMan++;
      }
    }
  }
  else {
    if (peoplePresent) {
      sending = true;
      peoplePresent = false;
    }
  }

  if (peoplePresent && !noCameraTrig) {
    debug('AUTO TRIG S:' + countForSpaceInvaders + ' D:' + countForDominos);
    if ((infos.count > 2) && (infos.count < 5)) {
      countForSpaceInvaders = 0;
      countForDominos++;
      if (countForDominos > 2) {
        debug('DOMINOS TRIGGER');
        setNoCameraTrig();
        app.locals.brCtrl.pushTrigger(dominoGameTriggerId);
        app.locals.brCtrl.reArmPushNFC(0);
      }
    }
    else if ((infos.count >= 1) || (infos.count > 4)) {
      countForDominos = 0;
      countForSpaceInvaders++;
      if (countForSpaceInvaders > 2) {
        debug('ALIENS TRIGGER');
        setNoCameraTrig();
        app.locals.brCtrl.pushTrigger(spaceGameTriggerId);
        app.locals.brCtrl.reArmPushNFC(0);
      }
    }
  }
  else {
    debug('AUTO TRIG STATE:' + noCameraTrig);
    countForDominos = 0;
    countForSpaceInvaders = 0;
  }

  if (sending) {
    debug('Detection event Count : ' + infos.count);
    cameraFlux.emit('detection_info', infos);
    sending = false;
  }
};

httpServer.listen(app.get('port'), function () {
  debug('Express server listening on port ' + httpServer.address().port);
  if (cameraPort) {
    debug('CAMERA ON', cameraPort);
    camera.open(cameraPort)
      .then(function (cam) {
        return cam.start(CameraCallback);
      })
      .then(function (cam) {
        debug('Camera de detection de visage démarré !', cam);
        cameraFlux.on('connection', function (socket) {
          debug('client connected to camera  : ' + socket.id + " ip:" + socket.handshake.address);
          sending = true;
        });
      })
      .catch(function (err, cam) {
        debug('CAMERA ERREUR ', err, cam);
      })
  }
});
