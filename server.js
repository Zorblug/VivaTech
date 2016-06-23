'use strict'

var debug = require('debug')('DominosServer');
var http = require('http');

var app = require('./app.js');
var GameServer = require('./lib/dominosServerControl.js');

var httpServer = http.createServer(app);

var gameServer = new GameServer(httpServer, 30, 10);
gameServer.init();

httpServer.listen(app.get('port'), function () {
  debug('Express server listening on port ' + httpServer.address().port);
})
