'use strict'

var debug = require('debug')('DominosServer');
var http = require('http');
var socketIO = require('socket.io');

var app = require('./app.js');
var DominoGameServer = require('./lib/dominosServerControl.js');
var VirtualJoystickServer = require('./lib/virtualJoystickServer.js');

var httpServer = http.createServer(app);
var io = socketIO.listen(httpServer);

var dominosGameServer = new DominoGameServer(io, 45, 30);
dominosGameServer.init();

var serverJoystick = new VirtualJoystickServer(io, 45);
serverJoystick.init();
serverJoystick.Events.on("close_game", function () {
    debug("CLOSE GAME SPACE INVADERS EVENTS");
    // pushTrigger(106241721);//Barcelone
    // reArmPushNFC(0);
});

httpServer.listen(app.get('port'), function () {
  debug('Express server listening on port ' + httpServer.address().port);
});
