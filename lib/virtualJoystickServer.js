/// <reference path="collection.js" />
/// <reference path="event.js" />
/// <reference path="/socket.io/socket.io.js" />

"use strict";

var Debug = require('debug');
var Collection = require('./collection.js');
var EventEmitter = require('events').EventEmitter;

var VirtualJoystick = VirtualJoystick || {};//Espace de nom

VirtualJoystick.Type = { none: 0, game: 1, remote: 2 };

VirtualJoystick.SocketClient = function(socket) {
    this._type = VirtualJoystick.Type.none;
    this._socket = socket;
    this._update = Date.now();
}

VirtualJoystick.SocketClient.prototype = {
    setType: function (type) {
        this._type = type;
        this._update = Date.now();
    },
    setDate: function () {
        this._update = Date.now();
    },
    send: function (verbe, data) {
        this._socket.emit(verbe,data);
    },
    getId: function () {
        return this._socket.id;
    }
}

//Contructeur de l'objet serveur
VirtualJoystick.Server = function (io, garbageDelay) {
    this.debug = Debug('joystick.server');
    this._io = io.of('/joystick');

    this._socketsClient = new Collection();
    this._socketGame = undefined;

    var delayInSeconds = garbageDelay || 30;
    this._garbageDelay = delayInSeconds * 1000;

    this.Events = new EventEmitter();
}

VirtualJoystick.Server.prototype = {
    init: function () {
        var that = this;

        this._io.on('connection', function (socket) {
            console.log('client connected  : ' + socket.id + " ip:" + socket.handshake.address);
            that._socketsClient.add(socket.id, new VirtualJoystick.SocketClient(socket));

            //Message game --> server
            socket.on('game', function (data) {
                console.log('GAME :' + socket.id);
                if (that._socketsClient.item(socket.id)) {
                    that._socketsClient.item(socket.id).setType(VirtualJoystick.Type.game);
                    that._socketGame = that._socketsClient.item(socket.id);
                }
            });

            //Message remotes --> server --> game
            socket.on('remote', function () {
                console.log('REMOTE : ' + socket.id);
                if (that._socketsClient.item(socket.id)) {
                    that._socketsClient.item(socket.id).setType(VirtualJoystick.Type.remote);
                }
                if (that._socketGame != undefined) {
                    console.log(' -> transmit to :' + that._socketGame._socket.handshake.address);
                    that._socketGame.send('remote', { id : socket.id });
                }
            });

            //Déconnexion du server (remotes --> server --> game ou  game --> server --> remotes)
            socket.on('close', function () {
                console.log('client disconnected  : ' + socket.id);

                if (that._socketGame != undefined) {
                    if (that._socketGame.getId() == socket.id) {
                        console.log('GAME disconnected  : ' + socket.id);
                        that._socketsClient.forEach(function (remote) {
                            if (remote.type == VirtualJoystick.Type.remote) {
                                remote.send('close', { id : that._socketGame.getId() });
                            }
                        });

                        that.socketGame = undefined;
                        that.Events.emit('close_game');
                    }
                    else {
                        console.log('REMOTE disconnected  : ' + socket.id);
                        that._socketGame.send('close', { id : socket.id });
                        that.Events.emit('close_remote');
                    }
                }

                that._socketsClient.remove(socket.id);
            });

            //Message remotes --> game
            socket.on('move', function (data) {
                console.log('Move :' + socket.id + ' - ' + JSON.stringify(data));

                if (that._socketsClient.item(socket.id)) {
                    that._socketsClient.item(socket.id).setDate();
                }
                if (that._socketGame != undefined) {
                    console.log(' -> transmit...');
                    that._socketGame.send('move', { id : socket.id, data: data });
                }
            });

            //Message remotes --> game
            socket.on('button', function (data) {
                console.log('Button :' + socket.id + ' - ' + JSON.stringify(data));

                if (that._socketsClient.item(socket.id)) {
                    that._socketsClient.item(socket.id).setDate();
                }
                if (that._socketGame != undefined) {
                    console.log(' -> transmit...');
                    that._socketGame.send('button', { id : socket.id, data: data });
                }
            });

            //Message remotes --> game
            socket.on('click', function (data) {
                console.log('Click :' + socket.id + ' - ' + JSON.stringify(data));

                if (that._socketsClient.item(socket.id)) {
                    that._socketsClient.item(socket.id).setDate();
                }
                if (that._socketGame != undefined) {
                    console.log(' -> transmit...');
                    that._socketGame.send('click', { id : socket.id, data: data });
                }
            });

            //Message game --> remotes ou game --> remote
            socket.on('info', function (data) {
                console.log('Info :' + socket.id + ' - ' + JSON.stringify(data));

                if (data.id != undefined) {
                    if (that._socketsClient.item(data.id)) {
                        that._socketsClient.item(data.id).send('info', { id : socket.id, data: data });
                    }
                }
                else {
                    that._socketsClient.forEach(function (client) {
                        if (client.type == VirtualJoystick.Type.remote) {
                            client.send('info', { id : 'all', data: data });
                        }
                    });
                }
            });

            socket.on('echo', function (data) {
                console.log('echo :' + socket.id + ' - ' + data);
                socket.emit('echo', data);
            });

        });

        setInterval(function () {
            var toDelete = [];
            var now = Date.now();

            //Extraction des sockets ne donnant plus signe de vie
            that._socketsClient.forEach(function (client) {
                if (client.type == VirtualJoystick.Type.remote) {
                    var delay = now - client.update;

                    if (delay > that._garbageDelay) {
                        toDelete.push(client.socket.id);
                        client.send('close');
                    }
                }
            });

            //Suppression des sockets mortes
            for (var i in toDelete) {
                console.log('delete client : ' + toDelete[i]);
                that._socketsClient.remove(toDelete[i]);
                if (that._socketGame != undefined) {
                    that._socketGame.send('close', { id : toDelete[i] });
                }
            }
        }, 10000);
    },

    //Envoie d'une information au jeux - server --> game
    sendToGame: function (data) {
        console.log('SERVER : ' + JSON.stringify(data));

        if (this._socketGame != undefined) {
            console.log(' -> transmit to :' + this._socketGame._socket.handshake.address);
            this._socketGame.send('server', { data: data });
        }
    },

    //Envoie d'une information aux télécommandes - server --> remotes
    sendToRemotes: function (data) {
        console.log('SERVER : ' + JSON.stringify(data));

        this._socketsClient.forEach(function (client) {
            if (client.type == VirtualJoystick.Type.remote) {
                console.log(' -> transmit to :' + client._socket.handshake.address);
                client.send('server', { id : 'all', data: data });
            }
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = VirtualJoystick.Server;
}
