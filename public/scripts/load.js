/// <reference path="dominosGameInterface.js" />

"use strict";
(function load() {
    var dominosObserver = new Domino.GameInterface('http://127.0.0.1:3000');

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        dominosObserver.onNewPlayer(function (data) {
            console.log('NEW PLAYER :' + JSON.stringify(data));
        });

        dominosObserver.onStart(function (data) {
            console.log('START :' + JSON.stringify(data));
        });

        dominosObserver.onTurnChange(function (data) {
            console.log('TURN :' + JSON.stringify(data));
        });

        dominosObserver.onGameOver(function (data) {
            console.log('GAME OVER :' + JSON.stringify(data));
        });

        dominosObserver.onError(function (data) {
            console.log('ERROR :' + JSON.stringify(data));
        });


        dominosObserver.onClose(function (data) {
            console.log('CLOSE :' + JSON.stringify(data));
        });

        dominosObserver.init(function (data) {
            console.log('INIT CALL BACK :' + JSON.stringify(data));
        });
    }

})();