'use strict';

var io = require('socket.io');

function attachWebSockets (server) {
  if (attachWebSockets.sockets) {
    return;
  }

  var ws = io.listen(server);
  attachWebSockets.io = ws;
}

module.exports = attachWebSockets;