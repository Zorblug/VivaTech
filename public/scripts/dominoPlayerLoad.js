/// <reference path="dominosPlayerInterface.js" />

"use strict";
(function load() {
    var dominosObserver = new Domino.PlayerInterface('http://127.0.0.1:3000');

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        dominosObserver.onStart(function (obj) {
            console.log('START :' + JSON.stringify(obj.getHand()));
        });

        dominosObserver.onNewPlayer(function (data) {
            console.log('NEW PLAYER :' + JSON.stringify(data));
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


        dominosObserver.init({ name: 'Achile' }, function (data) {
            console.log("INIT callback: " + JSON.stringify(data));
        });


        var bt = document.getElementById('start');
        bt.addEventListener('click', function () {
            dominosObserver.start();
        });
    }

})();