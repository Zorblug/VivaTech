/// <reference path="collection.js" />
/// <reference path="event.js" />
/// <reference path="game.js" />
/// <reference path="underscore.js" />

"use strict";

var Domino = Domino || {};//Espace de nom

/* * Interface table de jeux *
 */
Domino.GameInterface = function GameInterface(serverAddress) {
    this.debug = debug('domino.tableGame');

    this._players = undefined;
    this._pile = undefined;
    this._table = undefined;
    this._turn = -1;
    this._currentPlayer = undefined;

    this.debug('Connect to %s', serverAddress);
    this._socket = io.connect(serverAddress + '/domino');
    this._events = new ObservableEvents();

    this._initCallback = undefined;
}

Domino.GameInterface.prototype.init = function init(callback) {
    if (typeof callback === 'function') {
        this._initCallback = callback;
    }
    else {
        this._initCallback = undefined;
    }

    this.emit('game');

    var that = this;

    this._socket.on('init', function (data) {
        that.debug('Initialisation de la partie : %s', JSON.stringify(data));
        if (that._initCallback) {
            that._initCallback.call(that, data);
            that._initCallback = undefined;
        }
    });

    this._socket.on('new_player', function (data) {
        that.debug('Nouveau joueur : %s', JSON.stringify(data));
        that._events.fire('new_player', data);
    });

    this._socket.on('start', function (data) {
        that.debug('Debut de partie : %s', JSON.stringify(data));

        that._players = data.players;
        that._pile = data.pile;
        that._table = data.table;
        that._turn = data.turn;
        that._currentPlayer = data.player;

        that._events.fire('start', data);
    });


    this._socket.on('end', function (data) {
        that.debug('Fin de la partie : %s', JSON.stringify(data));

        that._events.fire('end', { winner: data.winner });
    });

    this._socket.on('turn', function (data) {
        that.debug('Tour : %s', JSON.stringify(data));

        that._pile = data.pile;
        that._table = data.table;
        that._turn = data.turn;
        that._currentPlayer = data.player;

        that._events.fire('turn', data);
    });

    this._socket.on('error', function (data) {
        that._events.fire('error', data);
    });

    this._socket.on('close', function (data) {
        that._events.fire('close', data);
    });
};

Domino.GameInterface.prototype.emit = function emit(verbe, data) {
    this.debug("EMIT %s : %s.", verbe, JSON.stringify(data));
    this._socket.emit(verbe, data);
};

Domino.GameInterface.prototype.getTable = function getTable() {
    return this._table;
};

Domino.GameInterface.prototype.getPile = function getPile() {
    return this._pile;
};

Domino.GameInterface.prototype.getPlayers = function getPlayers() {
    return _.values(this._players);
};

Domino.GameInterface.prototype.getCurrentPlayers = function getCurrentPlayers() {
    return this._currentPlayer;
};

Domino.GameInterface.prototype.getTurn = function getTurn() {
    return this._turn;
};

Domino.GameInterface.prototype.onStart = function onStart(callback) {
    this._events.addObserver('start', callback);
};

Domino.GameInterface.prototype.onTurnChange = function onTurnChange(callback) {
    this._events.addObserver('turn', callback);
};

Domino.GameInterface.prototype.onNewPlayer = function onNewPlayer(callback) {
    this._events.addObserver('new_player', callback);
};

Domino.GameInterface.prototype.onGameOver = function onGameOver(callback) {
    this._events.addObserver('end', callback);
};

Domino.GameInterface.prototype.onError = function onError(callback) {
    this._events.addObserver('error', callback);
};

Domino.GameInterface.prototype.onClose = function onClose(callback) {
    this._events.addObserver('close', callback);
};
