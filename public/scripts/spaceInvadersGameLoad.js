
var game;

function startAnimations() {
    game.state.start('spaceInvaders');
}

function BroadSignPlay() { //set up
    startAnimations()
}

(function () {

    var init = function init() {
        game = new Phaser.Game(1080, 1920, Phaser.CANVAS, 'gameView');

        console.log('SPACE INVADERS CONNECTE TO : ' + config.address);
        game.remoteInput = new VirtualJoystick.Receiver('http://' + config.address + ':' + config.port); //Joystick virtuel

        game.remoteInput.connect();
        ////#region SPECIAL VERSION SANS BROADSIGN

        ////#region QRCODE
        //game._qrcodeBackgroud = document.getElementById("qrBackground");
        //game._qrcode = new QRCode("qrcode", { useSVG: true });
        //game._qrcode.makeCode('http://' + localip + ':7500/controls');

        //game.clearQR = function () {
        //    game._qrcode.clear();
        //    game._qrcodeBackgroud.hidden = true;

        //};

        //game.activeQR = function () {
        //    game._qrcode.makeCode('http://' + localip + ':7500/controls');
        //    game._qrcodeBackgroud.hidden = false;

        //};
        ////#endregion
        ////#endregion

        game.state.add('game', SpaceInvaders.Game);
        game.state.add('result', SpaceInvaders.Result);
        game.state.start('game');
    };

    document.addEventListener("DOMContentLoaded", init);
})();
