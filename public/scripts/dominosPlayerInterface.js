﻿/// <reference path="collection.js" />
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
        var me = data.players.collection[that._playerData.id];
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
        var canPlay = false;
        if (this._actived) {
            var that = this;
            playableInfos = this._playerData.hand.map(function (currentValue, index, arr) {
                var info = Domino.PlayerInterface.isDominoPlayable(currentValue, that._currentTable);
                canPlay = canPlay || info.some(function(tip){ return tip >= 0; });
                return Domino.PlayerInterface.isDominoPlayable(currentValue, that._currentTable);
            });
        }
        else {
            playableInfos = this._playerData.hand.map(function (currentValue, index, arr) {
                return [-1, -1];
            });
        }
        return {
            hand : this._playerData.hand,
            playablesDom: playableInfos,
            canPlay: canPlay
        };
    }
    else {
        return {
            hand : [],
            playablesDom: [],
            canPlay: false
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




// /** Retourne la liste des dominos jouables
//  *  dominosListe    :[array] tableau de dominos a tester
//  *  table           :[array] dominos posés sur la table
//  *  return          :[array] [int] index des dominos jouables dans la liste à tester si aucun vide
//  */
// Domino.PlayerInterface.foundPlayablesDominos = function foundPlayablesDominos(dominosListe, table) {
//     return dominosListe.map(function (currentValue, index, arr) {
//         var playable = Domino.PlayerInterface.isDominoPlayable(currentValue , table).some(function (tip) { return tip === true; });
//         if (playable) {
//             return index;
//         }
//         else {
//             return -1;
//         }
//     }).filter(function (currentValue, index, arr) { return currentValue >= 0; });
// };

/** Test si un domino est jouable sur la table à chaque extrémité
 *  domino       : [array] [x,y] domino à tester
 *  table        : [array] dominos posés sur la table
 *  return : [array] [int,int] avec cote possible
 *              en index 0 si il est possible de posé le domino cote x  : ,
 *              en index 1 si il est possible de posé le domino cote y  :
 *                0 : en debut de table
 *                1 : en fin de table
 *                -1: nul part
 */
Domino.PlayerInterface.isDominoPlayable = function isDominoPlayable(domino, table) {
    var sides = [1, 1];
    if (table.length > 0) {
        var firstTip = table[0][0];
        var lastTip = table[table.length - 1][1];

        if(domino[0] === firstTip){
          sides[0]=0;
        }
        else if (domino[0] === lastTip){
          sides[0]=1;
        }
        else {
          sides[0]=-1;
        }

        if(domino[1] === firstTip){
          sides[1]=0;
        }
        else if (domino[1] === lastTip){
          sides[1]=1;
        }
        else {
          sides[1]=-1;
        }
    }
  return sides;
};
