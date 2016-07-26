var _ = require('underscore');
var Debug = require('debug');
var Collection = require('./collection');

/** Jeux de dominos
 *  Un domino est un tableau de 2 entiers [x,y]
 *  La table de jeux est un tableau de dominos ou chaque domino est rangé et tourné de façon à représenter les dominos posés: [1,1],[1,4],[4,5],[5,3] etc..
 *  Les mains des joueurs et la pioche sont des tableaux de dominos.
 */
function Game() {
    this.maxCount = 4;//Nombre de joueur max
    this.dotNumber = 6;//Type de domino (6 ou 9)

    this.debug = Debug('jcdecaux.domino.game');

    this.isGameLaunched = false;//Partie commencée
    this.isGameFinished = false;//Partie terminée
    this.turn = 0;//Tour
    this.emptyTurn = 0; //Compteur de tour ou aucune action est réalisées

    this._players = new Collection();//Joueurs
    this._playersOrder = [];//Ordre de jeux par id de joueur
    this._currentPlayerIndex = 0;//Index joueur courrant 0 à nombre de joueur - 1

    this._gameSet = []; //Pioche
    this._tableSet = [];//Table
    this._firstIndex = -1;
}


/** initialise le jeux.
 *  construction des dominos.
 */
Game.prototype.initGameSet = function initGameSet() {
    this.isGameFinished = false;
    this.isGameLaunched = false;
    this.turn = 0;
    this.emptyTurn = 0;
    this._currentPlayerIndex = 0;

    this._players.clear();
    this._playersOrder.splice(0, this._playersOrder.length);

    this._tableSet.splice(0, this._tableSet.length);
    this._firstIndex = -1;
    this._gameSet.splice(0, this._gameSet.length);
    for (var i = 0; i <= this.dotNumber; i++) {
        for (var j = i; j <= this.dotNumber; j++) {
            this._gameSet.push([i, j]);
        }
    }
    this.debug('Initialisation du jeux :' + JSON.stringify(this._gameSet));
};

/** Charge le jeux et distribue les dominos aux joueurs
 *
 *  return :
 *          { players:[collection] liste des joueurs,
 *            order:[array] tableau des identifiant des joueurs ordonnées dans l'ordre du jeux -> [id1,id2,...],
 *            player:[player] le joueur actif,
 *            turn:[int] le tour,
 *            pile:[array] pioche du jeux,
 *            table:[array] dominos posés sur la table
 *            ending:[boolean] vrais si la partie est finie
 *          }
 */
Game.prototype.launchGame = function launchGame () {
    if (this.isGameLaunched === false) {
        this.isGameLaunched = true;
        var that = this;

        //Distribue les dominos
        this._players.forEach(function (player) {
            var handPartCount = 5;

            switch (that._players.count) {
                case 2:
                    handPartCount = 8;
                    break;
                case 3:
                    handPartCount = 6;
                    break;
                case 4:
                    handPartCount = 5;
                    break;
                default:
            }

            for (var i = 0; i < handPartCount; i++) {
                var randomIndex = _.random(0, (that._gameSet.length - 1));
                player.hand.push(that._gameSet[randomIndex]);
                that._gameSet.splice(randomIndex, 1);
            }
            that.debug('Distribution des dominos :' + JSON.stringify(player));
        });
    }
    //TODO determiner l'ordre suivant les règles

    return { players: this._players, order: this._playersOrder, player: this.getActivePlayer(), turn: this.turn, pile: this._gameSet, table: this._tableSet, ending: this.isGameFinished};
};

/** Ajoute un joueur
 * id           :[string] identifiant unique du joueur,
 * playerData   :[objet] données complémentaires
 * return : {
 *              result:[int] avec x:0 -> OK, -1-> max joueur atteints, -2-> partie commencée,
 *              count:[int] n de 1 à 4,
 *              player:[player]  le joueur ajouté
 *          }
 *
 *
 * Composition d'un objet player :
 *          {
 *              id:[string] identifiant unique du joueur,
 *              idx:[int] index ordre de jeux 0 à 3,
 *              hand:[array] liste des dominos du joueur,
 *              data:[objet] données complémentaires
 *          }
 */
Game.prototype.addNewPlayer = function addNewPlayer(id, playerData) {
    if (this.isGameLaunched === false) {
        if (this._players.count < this.maxCount) {
            var newPlayer = { id: id, idx: this._players.count, hand: [], data: playerData };
            this._players.add(id, newPlayer);
            this._playersOrder.push(id);
            this.debug('Ajour d\'un joueur ' + JSON.stringify(newPlayer));
            return {result: 0, count: this._players.count, player: newPlayer};
        }
        else {
            this.debug('Nombre de joueur max atteind !');
            return { result: -1, count: this._players.count, player:undefined };
        }
    }
    else {
        this.debug('La partie est déja lancée !');
        return { result: -2, count: this._players.count, player: undefined  };
    }
};

/** Retourne le joueur actif dans le tour
 *  return : [player]
 */
Game.prototype.getActivePlayer = function getActivePlayer() {
    return this._players.item(this._playersOrder[this._currentPlayerIndex]);
};

/** Retourne le tour courant
 *  return : {
 *              player:[player] le joueur actif,
 *              turn:[int] le tour,
 *              pile:[array] pioche du jeux,
 *              table:[array] dominos posés sur la table
 *              first:[int] index du premier domino posé
 *              ending:[boolean] vrais si la partie est finie
 *           }
 */
Game.prototype.currentTurn = function currentTurn() {
    return { player: this.getActivePlayer(), turn: this.turn, pile: this._gameSet, table: this._tableSet,first:this._firstIndex, ending: this.isGameFinished };
};

/** Passe au tour suivant (joueur suivant)
 *  return :    {
 *                  player:[player] le joueur actif ,
 *                  turn:[int] le tour,
 *                  pile:[array] la pioche,
 *                  table:[array] dominos posés sur la table
 *                  first:[int] index du premier domino posé
 *                  ending:[boolean] vrais si la partie est finie
 *              }
 */
Game.prototype.nextTurn = function nextTurn() {
    if (this.isGameFinished === false) {
        this.turn++;
        this._currentPlayerIndex++;
        if (this._currentPlayerIndex >= this._playersOrder.length) {
            this._currentPlayerIndex = 0;
        }
    }
    this.debug("Tour de jeux suivant :" + JSON.stringify(this));
    return { player: this.getActivePlayer(), turn: this.turn , pile: this._gameSet, table: this._tableSet,first:this._firstIndex, ending: this.isGameFinished };
};

/** Test si un domino est jouable aux extrémités de la table
 *  domino :[array] un domino : [x,y] tableau de 2 entier de 0 à 6
 *  return : [array] [boolean,boolean] avec
 *              en index 0 si il est possible de posé le domino en debut de table,
 *              en index 1 si il est possible de posé le domino en fin de table
 */
Game.prototype.isDominoPlayable = function isDominoPlayable(domino) {
    return Game.isDominoPlayable(domino, this._tableSet);
};

/** Retourne la liste des dominos jouables pour le joueur actif
 *  return          :[array] [int] index des dominos jouables dans la liste
 */
Game.prototype.foundPlayablesDominosOnActivePlayer = function foundPlayablesDominos() {
    return Game.foundPlayablesDominos(this.getActivePlayer().hand, this._tableSet);
};

/** jouer un domino
 *  playerId    :[string] id du joueur.
 *  dominoIdx   :[int] index du domino à jouer dans la main du joueur.
 *  sideIdx     :[int] extrémité de la table ou poser le domino (0 sur le premier domino, 1 sur le dernier domino)
 *  return : {
 *              result:[int] 0=OK   -1=joueur inconnu -3=partie terminé
 *                                  -10=dominos introuvable dans la main du joueur
 *                                  -11=extrémité hors scope
 *                                  -12=domino non jouable ,
 *              player:[player] joueur actif,
 *              turn:[int] tour,
 *              pile:[array] pioche,
 *              table:[array] dominos posés sur la table
 *              first:[int] index du premier domino posé
 *              ending:[boolean] vrais si la partie est finie
 *           }
 */
Game.prototype.playDomino = function playDomino(playerId, dominoIdx, sideIdx) {
    var result = -3;
    var player = this._players.item(playerId);

    if (!this.isGameFinished) {
        if (player) {
            if(player.hand.length > dominoIdx) {
                var domino = player.hand[dominoIdx];
                var that = this;

                result = 0;
                if (this._tableSet.length > 0) {
                    switch (sideIdx) {
                        case 0:
                            var tip = this._tableSet[0][0];
                            if (domino.some(function (domTip) { return domTip === tip; })) {
                                if (domino[0] === tip) {
                                    domino.reverse();
                                }
                                that._putDomino(playerId, dominoIdx, 0, domino);
                            }
                            else {
                                this.debug('Impossible de jouer le domino :' + JSON.stringify(domino) + ' player :' + playerId);
                                result = -12;
                            }
                            break;
                        case 1:
                            var tip = this._tableSet[this._tableSet.length - 1][1];
                            if (domino.some(function (domTip) { return domTip === tip; })) {
                                if (domino[1] === tip) {
                                    domino.reverse();
                                }
                                that._putDomino(playerId, dominoIdx, 1, domino);
                            }
                            else {
                                this.debug('Impossible de jouer le domino :' + JSON.stringify(domino) + ' player :' + playerId);
                                result = -12;
                            }
                            break;
                        default:
                            this.debug('Extrémité de la table non définie: ' + side);
                            result = -11;
                            break;
                    }
                }
                else { //Premier domino
                    this._putDomino(playerId, dominoIdx, 1, domino);
                }
            }
            else {
                this.debug('Domino %d absent dans la main du joueur: %s', dominoIdx, JSON.stringify(player.hand));
                result = -10;
            }
        }
        else {
            this.debug('Joueur inconnu : ' + playerId);
            result = -1;
        }
    }
    else {
        this.debug('Jeux Terminé !');
        result = -3;
    }
    return { result:result, player: player, turn: this.turn , pile: this._gameSet, table: this._tableSet,first:this._firstIndex, ending: this.isGameFinished };
};

/** Pose un domino sur la table. (Fonction privé)
 *  playerId    :[string] id du joueur.
 *  dominoIdx   :[int] index du domino à jouer dans la main du joueur.
 *  sideIdx     :[int] extrémité de la table ou poser le domino (0 sur le premier domino, 1 sur le dernier domino)
 *  domino      :[array] domino tourné dans le bon sens
 */
Game.prototype._putDomino = function putDomino(playerId, dominoIdx, sideIdx, domino) {
    this.debug('Domino' + JSON.stringify(domino) + ' player :' + playerId + ' jouer');
    if(this._firstIndex < 0) {
      this._firstIndex = 0;
    }
    if (sideIdx === 1) {
        this._tableSet.push(domino);    //pose le domino sur la table a la fin du set
    }
    else {
        this._tableSet.unshift(domino);    //pose le domino sur la table au debut du set
        this._firstIndex++;
    }
    this._players.item(playerId).hand.splice(dominoIdx, 1);//Retire de la main du joueur
    this.debug('Table' + JSON.stringify(this._tableSet) + ' Main :' + JSON.stringify(this._players.item(playerId).hand));
    this.emptyTurn = 0;//Raz compteur tour sans action
    if (this._players.item(playerId).hand.length === 0) {
        this.isGameFinished = true;
    }
};

/** Pioche un domino dans la pile
 *  playerId :[string] identifiant du joueur qui pioche.
 *  return : { result: [int] 0=OK -1=joueur inconnu -2=pioche vide -3=Partie terminée,
 *             player: [player] joueur actif,
 *             turn:[int] tour,
 *             pile:[array] pioche,
 *             table:[array] dominos posés sur la table
 *             first:[int] index du premier domino posé
 *             ending:[boolean] vrais si la partie est finie
 *           }
 */
Game.prototype.pickDomino = function pickDomino(playerId){
    var result = -3;
    var player = this._players.item(playerId);
    if (!this.isGameFinished) {
        if (player) {
            if (this._gameSet.length > 0) {
                var randomIdx = _.random(0, (this._gameSet.length - 1));
                var newDomino = this._gameSet[randomIdx];
                this._players.item(playerId).hand.push(newDomino);
                this._gameSet.splice(randomIdx, 1);

                this.debug('Domino pioché dans la pile :' + JSON.stringify(newDomino) + ' player :' + JSON.stringify(player));
                this.emptyTurn = 0;//Raz compteur tour sans action
                result = 0;
            }
            else {
                this.emptyTurn++;//Un tour sans action
                if (this.emptyTurn > this._players.count ) {
                  this.isGameFinished = true;
                }

                this.debug('Pioche vide.');
                result = -2;
            }
        }
        else {
            this.debug('Player inconnu : ' + playerId);
            result = -1;
        }
    }
    return { result: result, player: player, turn: this.turn , pile: this._gameSet, table: this._tableSet,first:this._firstIndex, ending: this.isGameFinished };
}

/** Retourne la gagnant si le jeux est terminé
 * return : {
 *              players :[collection] liste des joueurs
 *              winner  :[player] le vainqueur
 *              turn:[int] tour,
 *              pile:[array] pioche,
 *              table:[array] dominos posés sur la table
 *              first:[int] index du premier domino posé
 *              ending:[boolean] vrais si la partie est finie
 *          }
 */
Game.prototype.getWinner = function getWinner() {
    var winner = undefined;
    if (this.isGameLaunched && this.isGameFinished) {
        this._players.forEach(function (player) {
            if (player.hand.length === 0) {
                winner = player;
            }
        });
        if(!winner) {
          this._players.forEach(function (player) {
              if(!winner) {
                winner = player;
              }
              else {
                if (player.hand.length < winner.hand.length) {
                  winner = player;
                }
              }
          });
        }
    }
    this.debug('Le gagnant est  : ' + JSON.stringify(winner));
    return { players: this._players, winner: winner, turn: this.turn, pile: this._gameSet, table: this._tableSet,first:this._firstIndex, ending: this.isGameFinished };
};



/** Retourne la liste des dominos jouables
 *  dominosListe    :[array] tableau de dominos a tester
 *  table           :[array] dominos posés sur la table
 *  return          :[array] [int] index des dominos jouables dans la liste à tester si aucun vide
 */
Game.foundPlayablesDominos = function foundPlayablesDominos(dominosListe, table) {
    return dominosListe.map(function (currentValue, index, arr) {
        var playable = Game.isDominoPlayable(currentValue , table).some(function (tip) { return tip === true; });
        if (playable) {
            return index;
        }
        else {
            return -1;
        }
    }).filter(function (currentValue, index, arr) { return currentValue >= 0; });
};

/** Test si un domino est jouable sur la table à chaque extrémité
 *  domino       : [array] [x,y] domino à tester
 *  table        : [array] dominos posés sur la table
 *  return : [array] [boolean,boolean] avec
 *              en index 0 si il est possible de posé le domino en debut de table,
 *              en index 1 si il est possible de posé le domino en fin de table
 */
Game.isDominoPlayable = function isDominoPlayable(domino, table) {
    var sides = [true, true];
    if (table.length > 0) {
        var firstTip = table[0][0];
        var lastTip = table[table.length - 1][1];

        if (domino.some(function (tip) { return (tip === firstTip); })) {
            sides[0] = true;
        }
        else {
            sides[0] = false;
        }

        if (domino.some(function (tip) { return (tip === lastTip); })) {
            sides[1] = true;
        }
        else {
            sides[1] = false;
        }

        return sides;
    }
    else {
        return sides;
    }
};

/** Test si un domino appartient à la liste de dominos
 *  dominosArray : [array] liste des dominos
 *  domino       : [array] [x,y] domino à chercher dans la liste
 *
 *  return       : true si le dominos a été trouvé
 */
Game.belongsTo = function (dominosArray, domino) {
    return dominosArray.some(function (item) {
        return ((item[0] === domino[0]) && (item[1] === domino[1])) || ((item[0] === domino[1]) && (item[1] === domino[0]));
    });
};

/** Choisi un dominos de façons aléatoire dans un liste d’index de dominos
 *  dominosIdxArray : [array] liste d'index des dominos d'une liste plus importante
 *  return          : [int] l'index choisi
 */
Game.chooseOneDominos = function (dominosIdxArray) {
    if (dominosIdxArray.length > 0) {
        if (dominosIdxArray.length > 1) {
            var randomIndex = _.random(0, (dominosIdxArray.length - 1));
            return dominosIdxArray[randomIndex];
        }
        else {
            return dominosIdxArray[0];
        }
    }
    else {
        return -1;
    }
}

module.exports = Game;
