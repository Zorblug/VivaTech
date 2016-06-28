/// <reference path="collection.js" />
/// <reference path="debug.js" />
/// <reference path="event.js" />
/// <reference path="game.js" />
/// <reference path="underscore.js" />

"use strict";

var Domino = Domino || {};//Espace de nom

/* * Interface Joueur *
 */

Domino.PlayerInterface = function PlayerInterface(serverAddress) {
    this.debug = debug('domino.player');

    this._playerData = undefined;
    this._currentTable = undefined;
    this._turn = -1;
    this._actived = false;

    this.debug('Connect to %s', serverAddress);
    this._socket = io.connect(serverAddress + '/domino');
    this._events = new ObservableEvents();

    this._initCallback = undefined;
    this._playCallback = undefined;
    this._pickCallback = undefined;
}

Domino.PlayerInterface.prototype.init = function init(data, callback) {
    if (typeof callback === 'function') {
        this._initCallback = callback;
    }
    else {
        this._initCallback = undefined;
    }

    this._socket.emit('player', data);

    var that = this;

    this._socket.on('player', function (data) {
        that.debug('JOUEUR INITIALISE : %s', JSON.stringify(data));
        that._playerData = data;
        if (that._initCallback) {
            that._initCallback.call(that, data);
            that._initCallback = undefined;
        }
    });

    this._socket.on('new_player', function (data) {
        that.debug('Nouveau joueur : %s', JSON.stringify(data));
        if (that._playerData && that._playerData.id !== data.player.id) {
            that.debug('Event "new_player" : %s', JSON.stringify(data));
            that._events.fire('new_player', data);
        }
    });

    this._socket.on('start', function (data) {
        that.debug('Debut de partie : %s', JSON.stringify(data));
        var me = data.players[that._playerData.id];
        if (me) {
            that._playerData = me;
            that._actived = that._playerData.id === data.player.id;
            that._currentTable = data.table;
            that._turn = data.turn;

            that._events.fire('start', data);
        }
    });

    this._socket.on('play', function (data) {
        that.debug('Résultat de l\'action : %s', JSON.stringify(data));

        if (data.player) {
            that._playerData = data.player;
            that._currentTable = data.table;

            if (that._playCallback) {
                that._playCallback.call(that, data);
                that._playCallback = undefined;
            }
        }
    });

    this._socket.on('end', function (data) {
        that.debug('Fin de la partie : %s', JSON.stringify(data));

        var iWin = data.winner.id === that._playerData.id;

        that._events.fire('end', { iWin: iWin, winner: data.winner });
    });

    this._socket.on('turn', function (data) {
        that.debug('Tour : %s', JSON.stringify(data));
        if (that._playerData) {
            that._actived = that._playerData.id === data.player.id;
            that._currentTable = data.table;
            that._turn = data.turn;

            that._events.fire('turn', data);
        }
    });

    this._socket.on('pick', function (data) {
        that.debug('Résultat de la pioche : %s', JSON.stringify(data));

        if (data.player) {
            that._playerData = data.player;

            if (that._pickCallback) {
                that._pickCallback.call(that, data);
                that._pickCallback = undefined;
            }
        }
    });

    this._socket.on('timeout', function (data) {
      that.debug('Timeout - le serveur a joué pour le joueur : %s', JSON.stringify(data));
      if (data.player) {
          that._playerData = data.player;
          that._currentTable = data.table;

          that._events.fire('timeout', data);
      }
    });

    this._socket.on('error', function (data) {
        that._events.fire('error', data);
    });

    this._socket.on('close', function (data) {
        that._events.fire('close', data);
    });
};

Domino.PlayerInterface.prototype.emit = function emit(verbe, data) {
    this.debug("EMIT %s : %s.", verbe, JSON.stringify(data));
    this._socket.emit(verbe, data);
};

Domino.PlayerInterface.prototype.start = function start() {
    this.emit('start');
};

Domino.PlayerInterface.prototype.getHand = function getHand() {
    if (this._playerData) {
        var playableInfos;
        if (this._actived) {
            var dom = Game.foundPlayablesDominos(this._playerData.hand, this._currentTable);
            playableInfos = this._playerData.hand.map(function (currentValue, index, arr) {
                return Game.isDominoPlayable(currentValue, this._currentTable);
            });
        }
        else {
            playableInfos = this._playerData.hand.map(function (currentValue, index, arr) {
                return [false, false];
            });
        }
        return {
            hand : this._playerData.hand,
            playablesDom: playableInfos
        };
    }
    else {
        return {
            hand : [],
            playablesDom: []
        };
    }
};

Domino.PlayerInterface.prototype.isActivated = function isActivated() {
    return this._actived;
};

Domino.PlayerInterface.prototype.play = function play(dominoIdx, sideIdx, callback) {
    if (typeof callback === 'function') {
        this._playCallback = callback;
    }
    else {
        this._playCallback = undefined;
    }
    this.emit('play', { dominoIdx: dominoIdx, sideIdx: sideIdx });
};

Domino.PlayerInterface.prototype.pick = function pick(callback) {
    if (typeof callback === 'function') {
        this._pickCallback = callback;
    }
    else {
        this._pickCallback = undefined;
    }
    this.emit('pick');
};

Domino.PlayerInterface.prototype.onStart = function onStart(callback) {
    this._events.addObserver('start', callback);
};

Domino.PlayerInterface.prototype.onTurnChange = function onTurnChange(callback) {
    this._events.addObserver('turn', callback);
};

Domino.PlayerInterface.prototype.onNewPlayer = function onNewPlayer(callback) {
    this._events.addObserver('new_player', callback);
};

Domino.PlayerInterface.prototype.onTimeout = function onTimeout(callback) {
    this._events.addObserver('timeout', callback);
};

Domino.PlayerInterface.prototype.onGameOver = function onGameOver(callback) {
    this._events.addObserver('end', callback);
};

Domino.PlayerInterface.prototype.onError = function onError(callback) {
    this._events.addObserver('error', callback);
};

Domino.PlayerInterface.prototype.onClose = function onClose(callback) {
    this._events.addObserver('close', callback);
};
