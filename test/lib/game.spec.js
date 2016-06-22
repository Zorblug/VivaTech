var assert = require('assert');
var _ = require('underscore');

describe('Test du jeux de dominos', function () {
    var game = require('../../lib/game.js');

    var id1 = 45565545;
    var id2 = 86868686;
    var id3 = 78787878;
    var id4 = 56565656;
    var id5 = 01010110;

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

    it('Creation de 2 joueurs', function () {
        var dominosGame = new game();
        dominosGame.initGameSet();

        assert.ok(dominosGame._gameSet.length === 28, "Nombre de dominos incorrecte !");

        var p1 = dominosGame.addNewPlayer(id1, { name: 'Achille' });
        assert.ok(dominosGame._players.count === 1, "Création du premier joueur à échoué !");
        assert.ok(dominosGame._players.item(id1).data.name === 'Achille', "Joueur 1 perte de données !");
        assert.deepEqual(p1, { result: 0, count: 1, player: { id:id1, idx:0, hand:[], data: { name : 'Achille'} } }, "Ajout joueur Achille incorrect !");

        var p2 = dominosGame.addNewPlayer(id2, { name: 'Bellérophon' });
        assert.ok(dominosGame._players.count === 2, "Création du second joueur à échoué !");
        assert.ok(dominosGame._players.item(id2).data.name === 'Bellérophon', "Joueur 2 perte de données !");
        assert.deepEqual(p2, { result: 0, count: 2 , player: { id: id2, idx: 1, hand: [], data: { name : 'Bellérophon' } } }, "Ajout joueur Bellérophon incorrect !");

        var gameData = dominosGame.launchGame();
        assert.ok(dominosGame._players.item(id1).hand.length === 8, "Joueur 1 doit avoir 8 dominos!");
        assert.ok(dominosGame._players.item(id2).hand.length === 8, "Joueur 2 doit avoir 8 dominos!");
        assert.ok(dominosGame._gameSet.length === 12, "La pioches doit avoir 12 dominos!");
        assert.ok((gameData.pile.length === 12) && (gameData.players.count === 2), "Réponse incorrecte !");

        assert.deepEqual(gameData.order, [id1, id2], "Ordre incorrecte !");

        var p5 = dominosGame.addNewPlayer(id5, { name: 'Ulysse' });
        assert.deepEqual(p5, { result: -2, count: 2, player: undefined }, "Ajout joueur incorrect !");
    });

    it('Creation de 3 joueurs', function () {
        var dominosGame = new game();
        dominosGame.initGameSet();

        assert.ok(dominosGame._gameSet.length === 28, "Nombre de dominos incorrecte !");

        var p1 = dominosGame.addNewPlayer(id1, { name: 'Achille' });
        assert.ok(dominosGame._players.count === 1, "Création du premier joueur à échoué !");
        assert.ok(dominosGame._players.item(id1).data.name === 'Achille', "Joueur 1 perte de données !");
        assert.deepEqual(p1, { result: 0, count: 1, player: { id: id1, idx: 0, hand: [], data: { name : 'Achille' } } }, "Ajout joueur incorrect !");

        var p2 = dominosGame.addNewPlayer(id2, { name: 'Bellérophon' });
        assert.ok(dominosGame._players.count === 2, "Création du second joueur à échoué !");
        assert.ok(dominosGame._players.item(id2).data.name === 'Bellérophon', "Joueur 2 perte de données !");
        assert.deepEqual(p2, { result: 0, count: 2 , player: { id: id2, idx: 1, hand: [], data: { name : 'Bellérophon' } } }, "Ajout joueur incorrect !");

        var p3 = dominosGame.addNewPlayer(id3, { name: 'Héraclès' });
        assert.ok(dominosGame._players.count === 3, "Création du troisième joueur à échoué !");
        assert.ok(dominosGame._players.item(id3).data.name === 'Héraclès', "Joueur 2 perte de données !");
        assert.deepEqual(p3, { result: 0, count: 3, player: { id: id3, idx: 2, hand: [], data: { name : 'Héraclès' } }}, "Ajout joueur incorrect !");


        var gameData = dominosGame.launchGame();
        assert.ok(dominosGame._players.item(id1).hand.length === 6, "Joueur 1 doit avoir 6 dominos!");
        assert.ok(dominosGame._players.item(id2).hand.length === 6, "Joueur 2 doit avoir 6 dominos!");
        assert.ok(dominosGame._players.item(id3).hand.length === 6, "Joueur 3 doit avoir 6 dominos!");
        assert.ok(dominosGame._gameSet.length === 10, "La pioches doit avoir 10 dominos!");
        assert.ok((gameData.pile.length === 10) && (gameData.players.count === 3), "Réponse incorrecte !");
        assert.deepEqual(gameData.order, [id1, id2, id3], "Ordre incorrecte !");
    });

    it('Creation de 4 joueurs', function () {
        var dominosGame = new game();
        dominosGame.initGameSet();

        assert.ok(dominosGame._gameSet.length === 28, "Nombre de dominos incorrecte !");

        var p1 = dominosGame.addNewPlayer(id1, { name: 'Achille' });
        assert.ok(dominosGame._players.count === 1, "Création du premier joueur à échoué !");
        assert.ok(dominosGame._players.item(id1).data.name === 'Achille', "Joueur 1 perte de données !");
        assert.deepEqual(p1, { result: 0, count: 1, player: { id: id1, idx: 0, hand: [], data: { name : 'Achille' } } }, "Ajout joueur incorrect !");

        var p2 = dominosGame.addNewPlayer(id2, { name: 'Bellérophon' });
        assert.ok(dominosGame._players.count === 2, "Création du second joueur à échoué !");
        assert.ok(dominosGame._players.item(id2).data.name === 'Bellérophon', "Joueur 2 perte de données !");
        assert.deepEqual(p2, { result: 0, count: 2 , player: { id: id2, idx: 1, hand: [], data: { name : 'Bellérophon' } } }, "Ajout joueur incorrect !");

        var p3 = dominosGame.addNewPlayer(id3, { name: 'Héraclès' });
        assert.ok(dominosGame._players.count === 3, "Création du troisième joueur à échoué !");
        assert.ok(dominosGame._players.item(id3).data.name === 'Héraclès', "Joueur 2 perte de données !");
        assert.deepEqual(p3, { result: 0, count: 3, player: { id: id3, idx: 2, hand: [], data: { name : 'Héraclès' } } } , "Ajout joueur incorrect !");

        var p4 = dominosGame.addNewPlayer(id4, { name: 'Jason' });
        assert.ok(dominosGame._players.count === 4, "Création du quatrième joueur à échoué !");
        assert.ok(dominosGame._players.item(id4).data.name === 'Jason', "Joueur 2 perte de données !");
        assert.deepEqual(p4, { result: 0, count: 4, player: { id: id4, idx: 3, hand: [], data: { name : 'Jason' } } }, "Ajout joueur incorrect !");

        var p5 = dominosGame.addNewPlayer(id5, { name: 'Ulysse' });
        assert.deepEqual(p5, { result: -1, count: 4, player: undefined }, "Ajout joueur incorrect !");

        var gameData =dominosGame.launchGame();
        assert.ok(dominosGame._players.item(id1).hand.length === 5, "Joueur 1 doit avoir 5 dominos!");
        assert.ok(dominosGame._players.item(id2).hand.length === 5, "Joueur 2 doit avoir 5 dominos!");
        assert.ok(dominosGame._players.item(id3).hand.length === 5, "Joueur 3 doit avoir 5 dominos!");
        assert.ok(dominosGame._players.item(id4).hand.length === 5, "Joueur 4 doit avoir 5 dominos!");
        assert.ok(dominosGame._gameSet.length === 8, "La pioches doit avoir 8 dominos!");
        assert.ok((gameData.pile.length === 8) && (gameData.players.count === 4), "Réponse incorrecte !");

        assert.deepEqual(gameData.order,[id1,id2,id3,id4], "Ordre incorrecte !");

        var p5 = dominosGame.addNewPlayer(id5, { name: 'Ulysse' });
        assert.deepEqual(p5, { result: -2, count: 4, player: undefined }, "Ajout joueur incorrect !");
    });

    it('Test belongsTo', function () {
        var liste = [[0, 2], [0, 5], [5, 6], [3, 3], [3, 5], [4, 5]];

        assert.ok(game.belongsTo(liste, [5, 6]) === true, 'Le dominos devrait appartenir à la liste');
        assert.ok(game.belongsTo(liste, [3, 6]) === false, 'Le dominos devrait ne pas appartenir à la liste');
    });

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
