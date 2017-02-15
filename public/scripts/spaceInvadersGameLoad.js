
var game;

function startAnimations() {
    game.state.start('game');
}

function BroadSignPlay() { //set up
    startAnimations();
}

(function () {

    var init = function init() {
        game = new Phaser.Game(1080, 1920, Phaser.CANVAS, 'gameView');

        console.log('GAME CONNECTE TO : ' + config.address);
        game.remoteInput = new VirtualJoystick.Receiver('http://' + config.address + ':' + config.port); //Joystick virtuel

        game.remoteInput.connect();

        // QRCODE
        game._qrcodeBackgroud = document.getElementById("qrBackground");
        game._qrcode = new QRCode("qrcode", { useSVG: true });
        game._qrcode.makeCode('http://' + config.addressRemote + ':' + config.port + '/space');
        // game._qrcode.makeCode('http://jcdecaux.fr');

        game.clearQR = function () {
           game._qrcode.clear();
           game._qrcodeBackgroud.hidden = true;

        };

        game.activeQR = function () {
           game._qrcode.makeCode('http://' + config.addressRemote + ':' + config.port + '/space');
           game._qrcodeBackgroud.hidden = false;
        };

        game.countMan = config.countMan;
        game.countWoman = config.countWoman;
        
        game.state.add('game', SpaceInvaders.Game);
        game.state.add('result', SpaceInvaders.Result);
        

        var broadSignRessourceID = window.location.search.split('com.broadsign.suite.bsp.resource_id=')[1];
        console.log('ID:' + broadSignRessourceID);
        if(!broadSignRessourceID) {
            game.state.start('game');
        }

        // for(var propName in window) {
        //     console.log('-' + propName + ' : ' + window[propName]);
        // }
    };

    document.addEventListener("DOMContentLoaded", init);
})();
