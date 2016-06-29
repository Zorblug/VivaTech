/// <reference path="Collection.js" />
/// <reference path="Vector2.js" />
/// <reference path="hand.js" />
/// <reference path="event.js" />

"use strict";
(function control() {

    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);//FPS 60 par secondes
        };
    })();


    // ** MAIN
    console.log('REMOTE CONNECTE TO : ' + config.address);
    var joystickInput = new VirtualJoystick.Emiter('http://' + config.address + ':' + config.port);

    var ships = ['fusee_Bleu', 'fusee_Jaune', 'fusee_Rouge', 'fusee_Vert', 'fusee_Violet', 'fusee_Gris'];
    var playerIndex = -1;
    var livesCount = 0;

    var canvas, c; // c : canvas -> context 2D
    var halfWidth, halfHeight;
    var topInfo, middleInfo, lives, score;

    document.addEventListener("DOMContentLoaded", init);

    window.onorientationchange = resetCanvas;
    window.onresize = resetCanvas;

    function orientationChange(event) {
        //console.log('TURN');
        var portraitOrientation = window.matchMedia("(orientation:portrait)");
        if (portraitOrientation.matches) {
            document.getElementById("controlView").style.display = "block";
        } else {
            document.getElementById("controlView").style.display = "none";
        }
    }

    function init() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', orientationChange);
            orientationChange();
         }

        joystickInput.connect();

        setupCanvas();

        topInfo = document.getElementById('viewText');
        middleInfo = document.getElementById('infosText');

        topInfo.innerText = "POUR LANCER LA PARTIE TOUCHER AVEC DEUX DOIGTS LA PARTIE DROITE DE L'ECRAN";
        middleInfo.innerText = "NUMBER OF PLAYER : 1";
        lives = document.getElementById('lives');
        score = document.getElementById('viewScore');

        joystickInput.onReceivedClose(function (context) {
            console.log('event: ' + JSON.stringify(context));
            topInfo.innerText = '';
            middleInfo.innerText = 'DISCONNECT !!';
        });

        joystickInput.onReceivedInfos(function (context) {
            console.log('event: ' + JSON.stringify(context));
            switch (context.data.state) {
                case 'ready': //Connection
                    var newLivesCount = context.data.lives;
                    playerIndex = context.data.index;

                    for (var i = livesCount; i < newLivesCount; i++) {
                        addLive(playerIndex);
                    }

                    livesCount = newLivesCount;
                    score.innerText = "YOU ARE THE PLAYER : " + playerIndex;
                    break;
                case 'team'://Info nombre de joueur
                    middleInfo.innerText = "PLAYERS COUNT : " + context.data.player;
                    break;
                case 'close'://Partie close
                    topInfo.innerText = 'Closed';
                    switch (context.data.why) {
                        case 'full':
                            middleInfo.innerText = 'NO MORE PLACE ! SORRY';
                            break;
                        case 'started':
                            middleInfo.innerText = 'GAME STARTED ! SORRY';
                            break;
                    }
                    score.innerText = "";
                    break;
                case 'start'://Lancement
                    topInfo.innerText = 'PLAYER : ' + playerIndex;
                    score.innerText = "SCORE : .";
                    joystickInput.vibrate([20, 20, 20]);
                    break;
                case 'hit'://Touché Vie perdus
                    var diff = livesCount - context.data.lives;
                    for (var i = 0; i < diff; i++) {
                        removLive();
                        joystickInput.vibrate([100, 50, 100, 50, 100]);
                    }
                    livesCount = context.data.lives;
                    break;
                case 'lives'://VIES GAGNEES
                    var diff = context.data.lives - livesCount;
                    for (var i = 0; i < diff; i++) {
                        addLive(playerIndex);
                        joystickInput.vibrate([50, 50]);
                    }
                    break;
                case 'collide'://Collision avec un autre joueur
                    joystickInput.vibrate(100);
                    break;
                case 'score'://Alien touché ou tué
                    score.innerText = "SCORE : " + context.data.score;
                    break;
                case 'kill'://Perdus
                    topInfo.innerText = 'Fin de la partie';
                    middleInfo.innerText = "GAME OVER !"
                    joystickInput.close();
                    joystickInput.vibrate([200, 50, 200, 50, 200, 50, 500, 50, 1000]);
                    break;
                case 'win'://Gagant
                    middleInfo.innerText = 'YOU ARE THE WINNER !';
                    score.innerText = "SCORE : " + context.data.score;
                    joystickInput.vibrate([500, 550, 500, 500, 1000]);
                    break;
                case 'end'://Fin de la partie
                    topInfo.innerText = 'FINISHED';
                    joystickInput.close();
                    break;
            }
        })

        canvas.addEventListener('pointerdown', onPointerDown, false);
        canvas.addEventListener('pointermove', onPointerMove, false);
        canvas.addEventListener('pointerup', onPointerUp, false);
        canvas.addEventListener('pointerout', onPointerUp, false);

        requestAnimFrame(draw);
    }

    function requestFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    }

    function resetCanvas(e) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        halfWidth = canvas.width / 2;
        halfHeight = canvas.height / 2;

        window.scrollTo(0, 0);
    }

    function setupCanvas() {
        canvas = document.getElementById('canvasSurfaceGame');

        requestFullscreen(canvas);

        c = canvas.getContext('2d');
        resetCanvas();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2;
    }

    function draw() {
        c.clearRect(0, 0, canvas.width, canvas.height);

        joystickInput.pointersList.forEach(function (touch) {
            if (joystickInput.isLeftPointer(touch.id)) {
                c.beginPath();
                c.strokeStyle = "cyan";
                c.lineWidth = 6;
                c.arc(joystickInput.leftPointerStartPos.x, joystickInput.leftPointerStartPos.y, 40, 0, Math.PI * 2, true);
                c.stroke();
                c.beginPath();
                c.strokeStyle = "cyan";
                c.lineWidth = 2;
                c.arc(joystickInput.leftPointerStartPos.x, joystickInput.leftPointerStartPos.y, 60, 0, Math.PI * 2, true);
                c.stroke();
                c.beginPath();
                c.strokeStyle = "cyan";

                c.arc(joystickInput.leftPointer.position.x, joystickInput.leftPointer.position.y, 40, 0, Math.PI * 2, true);
                c.stroke();

            } else {
                c.beginPath();
                c.strokeStyle = "red";
                c.lineWidth = "6";
                c.arc(touch.position.x, touch.position.y, 40, 0, Math.PI * 2, true);
                c.stroke();
            }
        });

        requestAnimFrame(draw);
    }

    function onPointerDown(e) {
        if ((joystickInput.leftPointer.id < 0) && (e.clientX < halfWidth)) {
            joystickInput.setLeftPointer(e.pointerId, e.clientX, e.clientY);
        }
        else {
            joystickInput.setRightPointer(e.pointerId, e.clientX, e.clientY)
        }
    }

    function onPointerMove(e) {
        joystickInput.movePointer(e.pointerId, e.clientX, e.clientY);
    }

    function onPointerUp(e) {
        joystickInput.removePointer(e.pointerId);
    }

    function addLive(index) {
        var img = new Image();

        img.src = '/assets/' + ships[index] + '.png';
        lives.appendChild(img);
    }

    function removLive() {
        lives.removeChild(lives.childNodes[1]);
    }
})();
