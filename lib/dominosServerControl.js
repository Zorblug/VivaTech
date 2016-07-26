/// <reference path="collection.js" />
/// <reference path="game.js" />

"use strict";

var Debug = require('debug');

var Collection = require('./collection.js');
var Game = require('./game');

var Domino = Domino || {};//Espace de nom

/* * Protocole de communication : *
 */

Domino.SocketClientType = { none: 0, game: 1, player: 2 };

Domino.SocketClient = function SocketClient(socket) {
    this._type = Domino.SocketClientType.none;
    this._index = 0;
    this._socket = socket;
    this._update = Date.now();
};

Domino.SocketClient.prototype = {
    setType: function setType(type) {
        this._type = type;
        this._update = Date.now();
    },
    setIndex: function setIndex(idx) {
        this._index = idx;
    },
    setDate: function setDate() {
        this._update = Date.now();
    },
    emit: function emit(verbe, data) {
        this._socket.emit(verbe, data);
    }
};

Domino.Server = function Server(io, garbageDelay, autoplayDelay) {
    this.debug = Debug('jcdecaux.domino.server');

    this._game = new Game();

    this._io = io.of('/domino');
    this._socketsClient = new Collection();
    this._socketGame = undefined;

    var garbageDelayInSeconds = garbageDelay || 60;
    this._garbageDelay = garbageDelayInSeconds * 1000;

    var autoplayDelayInSeconds = autoplayDelay || 30;
    this._autoplayDelay = (autoplayDelayInSeconds * 1000) + 500;
    this._autoplayTimer = undefined;
};

Domino.Server.prototype._broadcast = function broadcast (message, data) {
    this.debug(' broadcat - "%s" - (%s)', message,  JSON.stringify(data));
    this._io.emit(message, data);
};

Domino.Server.prototype._emitTurn = function emitTurn (turnInfos) {
    // ** Message TOUS ** *"turn"* Broadcast les informations du tour.
    this._broadcast('turn', turnInfos);
    this._kickAutoplay();
};

Domino.Server.prototype._emitGameover = function emitGameover () {
   var turnInfos = this._game.getWinner();
   this.debug(' fin du jeux - %s', JSON.stringify(turnInfos));
   /* ** Message TOUS ** *"end"* Fin de la partie avec le gagnant ! "*/
   this._broadcast('end', turnInfos);
};

Domino.Server.prototype._kickAutoplay = function kickAutoplay () {
    this._killAutoplay();

    var that = this;
    var turnInfos = that._game.currentTurn();
    if(!turnInfos.ending) {
        this._autoplayTimer = setTimeout( function() {
            that._autoplayTimer = undefined;
            turnInfos = that._game.currentTurn();

            var activePLayer = turnInfos.player;
            var playableDominos = that._game.foundPlayablesDominosOnActivePlayer();

            if(playableDominos.length > 0) {
                var dominoIdxToPlay = Game.chooseOneDominos(playableDominos);
                var playableInfo = that._game.isDominoPlayable(activePLayer.hand[dominoIdxToPlay]);

                turnInfos = that._game.playDomino(activePLayer.id, dominoIdxToPlay, (playableInfo[1] === true)? 1 : 0);
                that.debug(' autoplay - %s', JSON.stringify(turnInfos));
            }
            else {
                turnInfos = that._game.pickDomino(activePLayer.id);
            }

            var playerSocket = that._socketsClient.item(turnInfos.player.id);
            if(playerSocket) {
              /* * Message joueur * *"timeout"*  indique au joueur que le serveur a joué pour lui ! */
              playerSocket.emit('timeout', turnInfos);
            }

            if(turnInfos.ending) {
              that._emitGameover();
            }
            else {
              // Tour suivant -->
              that._emitTurn(that._game.nextTurn());
            }
        }, this._autoplayDelay);
    }
};

Domino.Server.prototype._killAutoplay = function killAutoplay () {
    if(this._autoplayTimer !== undefined) {
        clearTimeout(this._autoplayTimer);
        this._autoplayTimer = undefined;
    }
};

Domino.Server.prototype.init = function init() {
    var that = this;

    this._io.on('connection', function (socket) {
        that.debug('client connected %s IP:%s', socket.id, socket.handshake.address);

        that._socketsClient.add(socket.id, new Domino.SocketClient(socket));

        // ** Message serveur ** *"game"* => table de jeux envoie au serveur son affichage. Ouverture des inscriptions des joueurs.
        socket.on('game', function (data) {
            that.debug('GAME :' + socket.id);
            that._killAutoplay();

            if (that._socketsClient.item(socket.id)) {
                that._socketsClient.item(socket.id).setType(Domino.SocketClientType.game);
                that._socketGame = that._socketsClient.item(socket.id);

                // Initialise le jeux au lancement de la table de jeux
                that._game.initGameSet();

                that.debug('GAME INITIALIZE ...');
                /* ** Message jeux ** *"init"  démarrage du jeux. */
                that._socketGame.emit('init', { id : socket.id });
            }
        });

        // ** Message serveur ** *"player"* => Le joueur envoi au serveur son inscription. data contient un objet avec des information complémentaire.
        socket.on('player', function (data) {
            that.debug('PLAYER : ' + socket.id);
            if (that._socketsClient.item(socket.id)) {
                that._socketsClient.item(socket.id).setType(Domino.SocketClientType.player);
            }
            if (that._socketGame != undefined) {

                var result = that._game.addNewPlayer(socket.id, data);
                that.debug(' New player - %s', JSON.stringify(result));

                that.debug(' -> transmit to :' + that._socketGame._socket.handshake.address);
                /* ** Message joueur ** *"player"*  Retour à la création d'un joueur. */
                that._socketsClient.item(socket.id).emit('player', result.player);

                /* ** Message TOUS ** *"new_player"* Broadcast le message nouveau joueur (new_player) a toutes les parties(joueurs et table) */
                that._broadcast('new_player', result);
            }
            else {
                // ** Message Joueur ** *"error"* envoyé au joueur "Jeux pas encore initialisé"
                that._socketsClient.item(socket.id).emit('error', { err:1, msg:'Jeu pas initialisé !' });
            }
        });

        // ** Message serveur ** *"start"* => lancement de la partie envoyé par un joueur.
        socket.on('start', function () {
            that.debug('START : ' + socket.id);
            var client = that._socketsClient.item(socket.id)
            if (client) {
                client.setDate();
            }
            if (that._socketGame != undefined) {
                if (that._game.isGameLaunched === false) {
                    var turnInfos = that._game.launchGame();

                    that.debug(' start to :' + JSON.stringify(turnInfos));
                    /* ** Message TOUS ** *"start"* Broadcast le message start avec les informations complétée du 1° tour */
                    that._broadcast('start', turnInfos);
                    that._kickAutoplay();
                }
                else {
                    // ** Message Joueur ** *"error"* envoyé au joueur "Jeux déjà lancé ! "
                    that._socketsClient.item(socket.id).emit('error', { err: 2, msg: 'Jeu déjà lancé !' });
                }
            }
            else {
                // ** Message Joueur ** *"error"* envoyé au joueur "Jeux déconnecté ! "
                that._socketsClient.item(socket.id).emit('error', { err: 1, msg: 'Jeu déconnecté !' });
            }
        });

        /* ** Message serveur ** *"play"* jouer un domino
        *  data  => {   dominoIdx   :[int] index du domino à jouer dans la main du joueur.
        *               sideIdx     :[int] extrémité de la table ou poser le domino (0 sur le premier domino, 1 sur le dernier domino)
        *           }
        */
        socket.on('play', function (data) {
            that.debug('PLAY : ' + socket.id);
            var client = that._socketsClient.item(socket.id)
            if (client) {
                client.setDate();

                if (that._socketGame != undefined) {
                    that._killAutoplay();
                    var turnInfos = that._game.playDomino(socket.id, data.dominoIdx, data.sideIdx);
                    that.debug(' play - %s', JSON.stringify(turnInfos));
                    /* * Message Joueur ** *"play"* information sur l'action du joueur */
                    that._socketsClient.item(socket.id).emit('play', turnInfos);

                    if (turnInfos.ending) {
                        that._emitGameover();
                    }
                    else {
                        if (turnInfos.result === 0) {
                            //Passe au tour suivant
                            turnInfos = that._game.nextTurn();
                        }
                        else {
                            turnInfos = that._game.currentTurn();
                        }

                        that._emitTurn(turnInfos);
                    }
                }
                else {
                    that._broadcast('error', { err: 1, msg: 'Jeu déconnecté !' });
                }
            }
        });

        /* ** Message serveur ** *"pick"* piocher un domino dans la pile */
        socket.on('pick', function (data) {
            that.debug('PICK : ' + socket.id);
            var client = that._socketsClient.item(socket.id)
            if (client) {
                client.setDate();

                if (that._socketGame != undefined) {
                    that._killAutoplay();
                    var turnInfos = that._game.pickDomino(socket.id);
                    that.debug(' pick - %s', JSON.stringify(turnInfos));
                    /* * Message Joueur ** *"pick"* information sur l'action du joueur */
                    that._socketsClient.item(socket.id).emit('pick', turnInfos);

                    if (turnInfos.ending) {
                        that._emitGameover();
                    }
                    else {
                      if (turnInfos.result === 0 || turnInfos.result === -2) {
                        //Passe au tour suivant
                        turnInfos = that._game.nextTurn();
                        }
                        else {
                            turnInfos = that._game.currentTurn();
                        }

                       that._emitTurn(turnInfos);}
                   }
                else {
                    that._broadcast('error', { err: 1, msg: 'Jeu déconnecté !' });
                }
            }
        });

        // ** Message serveur ** *"close"* Déconnexion du server
        socket.on('close', function (data) {
            that.debug('client disconnected  : ' + socket.id);

            if (that._socketGame != undefined) {
                if (that._socketGame.id == socket.id) {
                    that.debug('GAME disconnected  : ' + socket.id);
                    that._socketsClient.forEach(function (player) {
                        if (player.type == Domino.SocketClientType.player) {
                            player.send('close', { id : that._socketGame.id });
                        }
                    });

                    that.socketGame = undefined;
                }
                else {
                    that.debug('REMOTE disconnected  : ' + socket.id);
                    that._socketGame.emit('close', { id : socket.id });
                }
            }
            that._socketsClient.remove(socket.id);
        });
    });

    setInterval(function () {
        var toDelete = [];
        var now = Date.now();

        //Extraction des sockets ne donnant plus signe de vie
        that._socketsClient.forEach(function (client) {
            if (client.type == Domino.SocketClientType.player) {
                var delay = now - client.update;

                if (delay > that._garbageDelay) {
                    toDelete.push(client.socket.id);
                    client.send('close');
                }
            }
        });

        //Suppression des sockets mortes
        for (var i in toDelete) {
            that.debug('delete client : ' + toDelete[i]);
            that._socketsClient.remove(toDelete[i]);
            if (that._socketGame != undefined) {
                that._socketGame.emit('close', { id : toDelete[i] });
            }
        }
    }, 10000);
}

// * node module *
if (typeof module !== 'undefined') {
    module.exports = Domino.Server;
}
