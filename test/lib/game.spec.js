var assert = require('assert');
var _ = require('underscore');

describe('Test du jeux de dominos', function () {
    var game = require('../../lib/game.js');

    var id1 = 45565545;
    var id2 = 86868686;
    var id3 = 78787878;
    var id4 = 56565656;
    var id5 = 11010110;
    
    it('Initialise', function () {
        var dominosGame = new game();
        dominosGame.initGameSet();

        var nbDominos = dominosGame._gameSet.length;
        assert.ok(nbDominos === 28, "Nombre de dominos incorrecte !");

        while (dominosGame._gameSet.length > 0) {
            var dom = dominosGame._gameSet.pop();
            assert.ok(dominosGame._gameSet.every(function (item) { return item != dom; }), "Tous les dominos ne sont pas different !");
        }
    });

    function initGame() {
        var gameInstance = new game();
        gameInstance.initGameSet();

        assert.ok(gameInstance._gameSet.length === 28, "Nombre de dominos incorrecte !");

        return gameInstance;
    }

    function creationJoueur(game, id, name, count) {
        var player = game.addNewPlayer(id, { name: name });
        assert.ok(game._players.count === count, 'Création du premier joueur à échoué !');
        assert.ok(game._players.item(id).data.name === name, 'Joueur 1 perte de données !');
        assert.deepEqual(player, { result: 0, count: count, player: { id: id, idx: count-1, hand:[], data: { name : name} } }, 'Ajout joueur' + name + ' incorrect !');
    } 

    function testLaunch(game, playerCount, handCount, pileCount, playerIdArrayOrder) {
        var gameData = game.launchGame();

        game._players.forEach(function(player) {
            assert.ok(player.hand.length === handCount, 'Joueur ' + id1 + ' doit avoir ' + handCount + ' dominos!');    
        });
        assert.ok(game._gameSet.length === pileCount, 'La pioches doit avoir' + pileCount + ' dominos');

        gameData.players.forEach(function(player) {            
            assert.ok(player.hand.length === handCount, 'Joueur ' + id1 + ' doit avoir ' + handCount + ' dominos!');    
        });
        assert.ok(gameData.pile.length === pileCount, 'La pile doit contenir ' + pileCount + ' dominos');
        assert.ok(gameData.players.count === playerCount, 'Nombre de joueur doit être ' + playerCount);   
        assert.deepEqual(gameData.order, playerIdArrayOrder, "Ordre des joueurs incorrecte !");
        assert.ok(gameData.turn === 0, "Le tour doit ête 0 !");
        assert.ok(gameData.ending === false, "L'indicateur de fin de partie doit être faux");     
    }

    it('Creation de 2 joueurs', function () {
        var dominosGame = initGame();

        creationJoueur(dominosGame, id1,'Achille',1);      
        creationJoueur(dominosGame, id2,'Bellérophon',2);

        testLaunch(dominosGame, 2, 8, 12, [id1, id2]);
        
        var p5 = dominosGame.addNewPlayer(id5, { name: 'Ulysse' });
        assert.deepEqual(p5, { result: -2, count: 2, player: undefined }, "Ajout joueur incorrect !");
    });

    it('Creation de 3 joueurs', function () {
       var dominosGame = initGame();

        creationJoueur(dominosGame, id1,'Achille',1);      
        creationJoueur(dominosGame, id2,'Bellérophon',2);
        creationJoueur(dominosGame, id3,'Héraclès',3);
        
        testLaunch(dominosGame, 3, 6, 10, [id1, id2, id3]);        
    });

    it('Creation de 4 joueurs', function () {
        var dominosGame = initGame();

        creationJoueur(dominosGame, id1,'Achille',1);      
        creationJoueur(dominosGame, id2,'Bellérophon',2);
        creationJoueur(dominosGame, id3,'Héraclès',3);
        creationJoueur(dominosGame, id4,'Jason',4);
                
        var p5 = dominosGame.addNewPlayer(id5, { name: 'Ulysse' });
        assert.deepEqual(p5, { result: -1, count: 4, player: undefined }, "Ajout joueur incorrect !");

        testLaunch(dominosGame, 4, 5, 8, [id1, id2, id3, id4]);
        
        var p5 = dominosGame.addNewPlayer(id5, { name: 'Ulysse' });
        assert.deepEqual(p5, { result: -2, count: 4, player: undefined }, "Ajout joueur incorrect !");
    });

    it('Test belongsTo', function () {
        var liste = [[0, 2], [0, 5], [5, 6], [3, 3], [3, 5], [4, 5]];

        assert.ok(game.belongsTo(liste, [5, 6]) === true, 'Le dominos devrait appartenir à la liste');
        assert.ok(game.belongsTo(liste, [3, 6]) === false, 'Le dominos devrait ne pas appartenir à la liste');
    });

    it('Test pick domino', function() {
        var dominosGame = initGame();
        creationJoueur(dominosGame, id1,'Achille',1);      
        creationJoueur(dominosGame, id2,'Bellérophon',2);

        testLaunch(dominosGame, 2, 8, 12, [id1, id2]);

        var firstPlayer = dominosGame.getActivePlayer();
        assert.ok(firstPlayer.id === id1, 'Le premier joueur doit avoir id1');
        var handBefore = firstPlayer.hand.slice(0);
        var pileBefore = dominosGame._gameSet.slice(0);

        var result = dominosGame.pickDomino(firstPlayer.id);        
        assert.ok(firstPlayer.hand.length === handBefore.length + 1,'La main du joueur doit avoir un domino de plus');
        assert.ok(result.pile.length + 1 === pileBefore.length,'La pile doit avoir un domino de moins');        
    })

    describe('Phase de jeux à 4 joueurs', function () {
        var dominosGame;
        var turnInfos;

        before(function () {
            dominosGame = new game();
            dominosGame.initGameSet();

            dominosGame.addNewPlayer(id1, { name: 'Achille' });
            dominosGame.addNewPlayer(id2, { name: 'Bellérophon' });
            dominosGame.addNewPlayer(id3, { name: 'Héraclès' });
            dominosGame.addNewPlayer(id4, { name: 'Jason' });

            turnInfos = dominosGame.launchGame();
        });

        it('Premier tour', function () {
            assert.ok(turnInfos.turn === 0, 'Premier tour doit être 0');

            var playerOne = turnInfos.players.item(id1);
            assert.ok(playerOne.id == id1, "Le joueur n'a pas le bon id");
            assert.ok(playerOne.idx === 0, "Le joueur n'a pas le bon index");

            var playerTwo = turnInfos.players.item(id2);
            assert.ok(playerTwo.id == id2, "Le joueur n'a pas le bon id");
            assert.ok(playerTwo.idx === 1, "Le joueur n'a pas le bon index");

            var playerThree = turnInfos.players.item(id3);
            assert.ok(playerThree.id == id3, "Le joueur n'a pas le bon id");
            assert.ok(playerThree.idx === 2, "Le joueur n'a pas le bon index");

            var playerFour = turnInfos.players.item(id4);
            assert.ok(playerFour.id == id4, "Le joueur n'a pas le bon id");
            assert.ok(playerFour.idx === 3, "Le joueur n'a pas le bon index");

            var activPlayer = dominosGame.getActivePlayer();
            assert.ok(activPlayer.id == id1, "Le joueur n'a pas le bon id");

            turnInfos = dominosGame.currentTurn();
            assert.ok(turnInfos.player.id == id1, "Le joueur n'a pas le bon id");
            assert.ok(turnInfos.turn === 0, 'Premier tour doit être 0');

            var playableDominos = game.foundPlayablesDominos(turnInfos.player.hand, turnInfos.table);
            assert.ok(playableDominos.length === turnInfos.player.hand.length, 'Tout les dominos sont jouable au premier ...');
            var dominoIdxToPlay = game.chooseOneDominos(playableDominos);
            assert.ok(dominoIdxToPlay >= 0, 'Dominos choisi ...');
            var playableInfo = dominosGame.isDominoPlayable(turnInfos.player.hand[dominoIdxToPlay]);
            assert.deepEqual(playableInfo, [true, true], 'Two sides must be possible in first turn');

            var action = dominosGame.playDomino(turnInfos.player.id, dominoIdxToPlay, _.random(0, 1));
            assert.ok(action.result === 0, 'Échec pose domino');
            assert.ok(action.table.length === 1, 'Premier domino sur la table');
        });

        it('Tour null', function () {
            var activPlayer = dominosGame.getActivePlayer();
            assert.ok(activPlayer.id == id1, "Le joueur n'a pas le bon id");

            var action = dominosGame.playDomino(id5, 5, 0);
            assert.ok(action.result === -1, 'Les joueurs non inscrit ne doivent pas jouer');
        });

        it('Partie complète', function () {
            turnInfos = dominosGame.nextTurn();

            while (!turnInfos.ending) {
                var activePLayer = turnInfos.player;
                var nbDominos = turnInfos.table.length;
                var nbDominosInHand = activePLayer.hand.length;

                var playableDominos = dominosGame.foundPlayablesDominosOnActivePlayer();
                if (playableDominos.length > 0) {

                    while (playableDominos.length > 0) {
                        var dominoIdxToPlay = game.chooseOneDominos(playableDominos);
                        assert.ok(dominoIdxToPlay >= 0, 'Dominos choisi ...');
                        var playableInfo = dominosGame.isDominoPlayable(activePLayer.hand[dominoIdxToPlay]);
                        var sideIdx = 0;
                        if (playableInfo[1] === true) {
                            sideIdx = 1;
                        }
                        else {
                            assert.ok(playableInfo[0] === true, 'Dominos non jouable.');
                        }
                        var action = dominosGame.playDomino(activePLayer.id, dominoIdxToPlay, sideIdx);
                        assert.ok(action.table.length === nbDominos + 1, 'Dominos posé sur la table ...');
                        assert.ok(activePLayer.hand.length === nbDominosInHand - 1, 'Un domino de moins dans la main ...');

                        nbDominos = turnInfos.table.length;
                        nbDominosInHand = activePLayer.hand.length;
                        playableDominos = dominosGame.foundPlayablesDominosOnActivePlayer();
                    }
                }
                else {
                    var action = dominosGame.pickDomino(activePLayer.id);
                    assert.ok(action.player.hand.length === nbDominosInHand + 1, 'Un dominos de plus dans la main.');
                }

                turnInfos = dominosGame.nextTurn();
            }

            var winnerInfos = dominosGame.getWinner();
            assert.ok(winnerInfos.ending === true, 'La partie doit être finie');
            assert.ok(winnerInfos.winner !== undefined, 'Le vainqueur est connue');
        });
    });
})
