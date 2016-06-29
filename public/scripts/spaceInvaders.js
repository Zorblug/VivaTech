/// <reference path="..\lib\phaser.js" />
/// <reference path="..\lib\collection.js" />
/// <reference path="..\lib\event.js" />
/// <reference path="..\lib\virtualJoystick.js" />

'use strict';

var SpaceInvaders = SpaceInvaders || {};//Espace de nom SpaceInvaders



//#region CREATION DES ALIENS
SpaceInvaders.Alien = function (game, x, y, key) {
    Phaser.Sprite.call(this, game, x, y,'ufo', key + '0');//Herite d'un sprite

    //this.anchor.setTo(0.5, 0.5);
    this.animations.add('fly', Phaser.Animation.generateFrameNames(key,0, 1, '', 1), 5, true);
    this.animations.play('fly');
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    this.checkWorldBounds = true;
    this.body.collideWorldBounds = true;//Empéche de l alien de sortir de l'écran
    //alien.outOfBoundsKill = true; //Detruits l'alien si il sort de l'écran
    this.body.velocity.y = 70;
    this.body.bounce.x = 1;
    this.body.bounce.y = 0.9;

    this.lifePoint = 3;
    this.scorePoint = 10;
};

SpaceInvaders.Alien.prototype = Object.create(Phaser.Sprite.prototype, {
    constructor: SpaceInvaders.Alien
});

SpaceInvaders.Alien.Keys = ['Bleu-','Rouge-','Jaune-','Multicolor-', 'Vert-'];

SpaceInvaders.Alien.preload = function () {
    game.load.atlas('ufo', '/assets/ufo.png', '/assets/ufo.json');
};


SpaceInvaders.Aliens = function (game) {
    this.game = game;

    //Events
    this.events = new ObservableEvents();;

    //Aliens
    this.indexSprites = 0;

    this.enemyBullets;
    this.firingDelay = 2000;
    this.firingTimer = 0;
    this.aliens;
    this.tween = undefined;

    //Explosions
    this.shotAnimation;
    this.destroyAnimation;
}

SpaceInvaders.Aliens.prototype = {
    _createAliensAttack: function () {
        if (this.tween == undefined) {
            this.tween = this.game.add.tween(this.aliens);
        }
        this.tween.onComplete.removeAll();
        this.tween.onLoop.removeAll();

        this.firingDelay = 2000;

        this._createAliens();
        //  mouvement du groupe d 'aliens
        this.tween.to({ x: 339}, 2000, Phaser.Easing.Linear.None, true, 0, 1, true);
        this.tween.onComplete.addOnce(this._alienGoBack, this);
        this.tween.onLoop.add(this._createAliens, this);
    },
    _alienGoBack: function () {
        this.firingDelay = 1500;
        this.tween.onLoop.remove(this._createAliens, this);

        this.tween.to({ x: 339 }, 1000, Phaser.Easing.Linear.None, true, 0, 2, true);
        this.tween.onComplete.addOnce(this._aliensRandomMove, this);
    },
    _aliensRandomMove: function () {
        this.firingDelay = 1000;

        for (var i in this.aliens.children) {
            this.aliens.children[i].scorePoint += 10;
            this.aliens.children[i].body.velocity.set(this.game.rnd.integerInRange(-400, 400), this.game.rnd.integerInRange(-160, 50));
        }
    },
    _createAliens: function () {
        var invaderColor = SpaceInvaders.Alien.Keys[this.indexSprites];
        for (var x = 0; x < 4; x++) {
            this.aliens.add(new SpaceInvaders.Alien(this.game, x * 200, 0, invaderColor));
        }
        this.indexSprites += 1;
        if (this.indexSprites >= SpaceInvaders.Alien.Keys.length) {
            this.indexSprites = 0;
        }
    },
    _alienHitsPlayer: function (player, bullet) {
        bullet.kill();//Efface le tire

        player.lives -= 1;
        this.events.fire('alienHitPlayer', { id: player.id, lives: player.lives });


        if (player.lives < 1) { // Quand le player est mort
            player.kill();
            //  KABOUM :)
            this.destroyAnimation.play(player.body.x, player.body.y);
            this.events.fire('alienKillPlayer', { id: player.id, lives: player.lives });
        }
        else {
            //  Ptit KABOUM
            this.shotAnimation.play(player.body.x, player.body.y);
        }

    },
    _alienCollidePlayer: function (player, alien) {
        player.lives -= 2;
        this.events.fire('alienHitPlayer', { id: player.id, lives: player.lives });

        alien.kill();
        //  KABOUM :)
        this.destroyAnimation.play(alien.body.x, alien.body.y);

        if (player.lives < 1) { // Quand le player est mort
            player.kill();
            //  KABOUM :)
            this.destroyAnimation.play(player.body.x, player.body.y);
            this.events.fire('alienKillPlayer', { id: player.id, lives: player.lives });
        }
        else {
            //  Ptit KABOUM
            this.shotAnimation.play(player.body.x + 15, player.body.y-10);
        }
    },
    preload: function () {
        //this.game.load.spritesheet('enemyBullet', 'assets/hatch_sheet.png', 16, 16);
        SpaceInvaders.Alien.preload();
    },
    create: function (shotAnimation, destroyAnimation) {
        // les tirs enemis
        this.enemyBullets = this.game.add.group();
        this.enemyBullets.enableBody = true;
        this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.enemyBullets.createMultiple(30, 'ufo', 'bullet-1');
        this.enemyBullets.setAll('anchor.x', 0.5);
        this.enemyBullets.setAll('anchor.y', 0.5);
        this.enemyBullets.setAll('outOfBoundsKill', true);
        this.enemyBullets.setAll('checkWorldBounds', true);
        this.enemyBullets.forEach(function (bullet) {
            bullet.animations.add('fireEnemy', Phaser.Animation.generateFrameNames('bullet-', 1, 4, '', 1), 5, true);
        }, this);

        // ALIENS
        this.aliens = this.game.add.group();
        this.aliens.enableBody = true;
        this.aliens.physicsBodyType = Phaser.Physics.ARCADE;

        this.aliens.x = 0;
        this.aliens.y = 0 ;

        this.shotAnimation = shotAnimation;
        this.destroyAnimation = destroyAnimation;
    },
    update: function(player){
        if (this.game.time.now > this.firingTimer) {
            this.fire(player)
        }
        this.game.physics.arcade.overlap(this.enemyBullets, player, this._alienHitsPlayer, null, this);
        this.game.physics.arcade.overlap(this.aliens, player, this._alienCollidePlayer, null, this);
    },
    updateAutoCollide: function () { //Collision entre aliens
        this.game.physics.arcade.collide(this.aliens);
    },
    fire: function (player) {
       var bullet = this.enemyBullets.getFirstExists(false);

       var livingEnemies = [];

       this.aliens.forEachAlive(function (alien) {
            livingEnemies.push(alien);
        });

        if (bullet && livingEnemies.length > 0) {

            var random = this.game.rnd.integerInRange(0, livingEnemies.length - 1);

            var shooter = livingEnemies[random];
            bullet.reset(shooter.body.x + 70, shooter.body.y + 85);
            bullet.play('fireEnemy');

            this.game.physics.arcade.moveToObject(bullet, player, 300);
            this.firingTimer = this.game.time.now + this.firingDelay;
        }
    },
    clearAttack: function () {
        this.aliens.removeAll();
    },
    startAttack: function () {
        this._createAliensAttack();
    },
    countLiving: function () {
        var count = this.aliens.countLiving()
        if (count == 0) {
            this.enemyBullets.callAll('kill', this);
        }
        return count;
    },
    onAlienKillPlayer: function (callback) {
        this.events.addObserver('alienKillPlayer', callback);
    },
    onAlienHitPlayer: function (callback) {
        this.events.addObserver('alienHitPlayer', callback);
    },
};
//#endregion

//#region JOUEUR


SpaceInvaders.Ship = function (game, x, y, keyIndex) {
    Phaser.Sprite.call(this, game, x, y, 'fusee', SpaceInvaders.Ship.Keys[keyIndex] + '1');//Herite d'un sprite

    game.physics.enable(this, Phaser.Physics.ARCADE);

    //  les tirs des joueurs
    this.bullets = this.game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(30, 'fusee', SpaceInvaders.Ship.BulletKeys[keyIndex]);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 1);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);
    //this.bullets.setAll('scale', 0.5);

    this.bulletTime = 0;


    //this.angle = -90;
    this.body.setSize(59, 84);
    this.anchor.setTo(0.5, 0.5);
    this.body.collideWorldBounds = true;//Empéche de la player de sortir de l'écran
    this.exists = false;
    this.alive = false;

    this.animations.add('player_fly', Phaser.Animation.generateFrameNames(SpaceInvaders.Ship.Keys[keyIndex] , 1, 4, '', 1), 20, true);
    this.play('player_fly');

    this.id = undefined;
    this.lives = 3;//Vies
    this.index = keyIndex;

    console.log("Player index : " + keyIndex);
};

SpaceInvaders.Ship.PlayersImg = ['fusee_Bleu', 'fusee_Jaune', 'fusee_Rouge', 'fusee_Vert', 'fusee_Violet', 'fusee_Gris'];
SpaceInvaders.Ship.Keys = ['fusee_Bleu_', 'fusee_Jaune_', 'fusee_Rouge_', 'fusee_Vert_', 'fusee_Violet_', 'fusee_Gris_'];
SpaceInvaders.Ship.BulletKeys = ['bullet_Bleu', 'bullet_Jaune', 'bullet_Rouge', 'bullet_Vert', 'bullet_Violet', 'bullet_Gris'];

SpaceInvaders.Ship.preload = function () {
    game.load.atlas('fusee', '/assets/ship.png', '/assets/ship.json');
};

SpaceInvaders.Ship.prototype = Object.create(Phaser.Sprite.prototype, {
    constructor: SpaceInvaders.Ship
});

SpaceInvaders.Ship.prototype.fire = function () {
    //FIRE
    if (this.game.time.now > this.bulletTime) {
        var bullet = this.bullets.getFirstExists(false);

        if (bullet) {
            bullet.id = this.id;
            bullet.reset(this.x, this.y - 55);
            bullet.body.velocity.y = -400;
            this.bulletTime = this.game.time.now + 400;
        }
    }
};

var playerVelocity = 200;
SpaceInvaders.Player =  function (parent, player, joystick) {
    this.parent = parent;
    //Control
    this.joystick = joystick;
    //Joueur
    this.player = player;
    this.score = 0;

    console.log('Create Player : ' + this.joystick.id);
}

SpaceInvaders.Player.prototype = {
    constructor: SpaceInvaders.Player,
    destroy:function(){
        console.log('Delete Player : ' + this.joystick.id);
        this.player.reset(100 + (100 * this.player.index), 1800);
        this.player.kill();
    },
    isAlive: function () {
        return this.player.alive;
    },
    update: function () {
        //this.player.body.velocity.setTo(0, 0);

        //XY
        if (this.joystick.left) {
            this.player.body.velocity.x = -playerVelocity;
        } else if (this.joystick.right) {
            this.player.body.velocity.x = playerVelocity;
        }
        else {
            this.player.body.velocity.x = 0;
        }

        //UP DOWN
        if (this.joystick.up) {
            this.player.body.velocity.y = playerVelocity;
        } else if (this.joystick.down) {
            this.player.body.velocity.y = -playerVelocity;
        }
        else {
            this.player.body.velocity.y = 0;
        }

        if (this.joystick.button > 0) {

            if (this.joystick.button > 1) {
                this.parent.events.fire('playerStartGame',{ id: this.joystick.id, data: this.joystick.button });
            } else {
                //FIRE
                this.player.fire();
            }
        }
    }
};
//#endregion

//#region GROUPE DE JOUEURS
SpaceInvaders.PlayerGroup = function (game, shotAnimation, destroyAnimation) {
    this.game = game;

    //Events Manager
    this.events = new ObservableEvents();

    //Explosions
    this.shotAnimation = shotAnimation;
    this.destroyAnimation = destroyAnimation;

    //Diferent joueurs
    this.indexSprites = 0;
    //Joueurs
    this.players = new Collection();
    this.playersGroup;
}

SpaceInvaders.PlayerGroup.prototype = {
    _playerHitsAlien: function (bullet, alien) {
        var point = alien.scorePoint;;

        // Allien touché
        bullet.kill();
        alien.lifePoint -= 1;

        if (alien.lifePoint < 1) {
            alien.kill();
            //  KABOUM :)
            this.destroyAnimation.play(alien.body.x, alien.body.y);
        }
        else {
            //  Ptit KABOUM
            this.shotAnimation.play(alien.body.x, alien.body.y);
            if (alien.lifePoint < 2) {
                alien.play('fly');

                var player = this.players.item(bullet.id);
                if (player) {
                    this.game.physics.arcade.moveToObject(alien, player.player, 200);
                }

                alien.scorePoint *= 2;
            }
        }

        this.events.fire('playerHitAlien', { id: bullet.id, point: point });
    },
    _playersCollide:function(playerA,playerB){
        console.log("COLLISION : " + playerA.id + " : " + playerB.id);
        this.events.fire('playersCollide', { A: playerA.id, B:playerB.id });
    },

    fire: function (player) {
        //FIRE
        player.fire();
    },
    //Return null si nombre de joueur max atteind
    createNewPLayer: function (id, joystick) {
        var alreadyExist = this.players.item(id);
        if (alreadyExist === undefined) {
            var player = this.playersGroup.getFirstExists(false);
            if (player) {
                player.id = id;
                player.lives = 4;//Vies
                player.score = 0;

                this.players.add(id, new SpaceInvaders.Player(this, player, joystick));

                player.revive();
                return player;
            }
            else {
                return null;
            }
        }
        else {
            return alreadyExist.player;
        }
    },
    countLiving: function () {
        return this.playersGroup.countLiving();
    },

    preload: function () {
        SpaceInvaders.Ship.preload();
    },
    create: function () {
        this.playersGroup = this.game.add.group();
        for (var i in SpaceInvaders.Ship.Keys) {
            var player = this.playersGroup.add(new SpaceInvaders.Ship(this.game, 100 + (100 * i), 1800, i));
        }
    },
    update: function (aliens) {
        var that = this;
        //PLAYERS
        this.players.forEach(function (player) {
            if (player.isAlive()) {
                player.update();
                aliens.update(player.player);
            }
            that.game.physics.arcade.overlap(player.player.bullets, aliens.aliens, that._playerHitsAlien, null, that);
        });

        this.game.physics.arcade.collide(this.playersGroup, this.playersGroup, this._playersCollide, null, this);
    },

    remove: function (id) {
        var player = this.players.item(id);
        if (player) {
            player.player.kill();
        }
        //this.players.remove(id);
    },
    removeAll:function() {
        this.players.forEach(function(item) {
            item.destroy(); });
        this.players.clear();
    },

    winner:function(){
        //Cherche le vainceur
        var winner = undefined;

        this.players.forEach(function (player) {
            if (winner == undefined) {
                winner = player;
            }
            else {
                if (winner.score < player.score) {
                    winner = player;
                }
            }
        });

        return winner;
    },

    onPlayerHitAlien: function (callback) {
        this.events.addObserver('playerHitAlien', callback);
    },
    onPlayerStartGame: function (callback) {
        this.events.addObserver('playerStartGame', callback);
    },
    onPlayersCollide: function (callback) {
        this.events.addObserver('playersCollide', callback);
    }
};

//#endregion

//#region CREATION DES EXPLOSIONS
SpaceInvaders.Explosions = function (game, key) {
    this.game = game;
    this.explosions;
    this.name = key;
}

SpaceInvaders.Explosions.prototype = {
    preload: function (fileUrl, frameWidth, frameHeight) {
        this.game.load.spritesheet(this.name, fileUrl, frameWidth, frameHeight);
    },
    create: function () {
        this.explosions = this.game.add.group();
        this.explosions.createMultiple(40, this.name);
        this.explosions.forEach(function (explosion) {
            explosion.anchor.x = 0.5;
            explosion.anchor.y = 0.5;
            explosion.animations.add(this.name);
        }, this);
    },
    play: function (x,y) {
        var explosion = this.explosions.getFirstExists(false);
        if (explosion) {
            explosion.reset(x, y);
            explosion.play(this.name, 30, false, true);
        }
    }
};
//#endregion

//#region JEUX / TABLEAU
var gameOverTimeOut = 5000;

SpaceInvaders.Game = function (game) {
    this.remoteInput; //Joystick virtuel

    this.theAliens; //Aliens

    this.litleExplosions;//Explosion touche
    this.bigExplosions;//Explosion final

    this.thePlayers; //Joueurs

    this.starfield;//Fond

    this.fontText;
    this.stateText;

    this.title;

    this.gameStarted = false;
}

SpaceInvaders.Game.prototype = {
    _showPLayerCount : function() { //ENVOIE LE NOMBRE DE JOUEUR CONNECTE
        var count = this.thePlayers.countLiving();
        this.remoteInput.broadcast({ state: 'team', player: count });

        if (!this.gameStarted) {
            if (count > 1) {
                this.stateText.text = count + " PLAYERS CONNECTED"
            }
            else {
                this.stateText.text = count + " PLAYER CONNECTED"
            }
        }
    },
    _newGame: function () {
        var that = this;
        setTimeout(function () {
            that.remoteInput.broadcast({ state: 'end' });// ENVOIE LA FIN DE LA PARTIE
            that.game.thePlayers = that.thePlayers;
            that.game.state.start("result");
        }, gameOverTimeOut);
    },
    _sendPlayerCollide: function(id) { //ENVOIE COLLISION ENTRE JOUEURS
        var player = this.thePlayers.players.item(id);
        if (player) {
            player.joystick.send({ state: 'collide' });
        }
    },

    //#region Phaser State functions
    init: function () {
        this.remoteInput = this.game.remoteInput; //Joystick virtuel

        this.theAliens = new SpaceInvaders.Aliens(this.game); //Aliens
        this.litleExplosions = new SpaceInvaders.Explosions(this.game, 'ptikaboum');//Explosion touche
        this.bigExplosions = new SpaceInvaders.Explosions(this.game, 'kaboom');//Explosion final
        this.thePlayers = new SpaceInvaders.PlayerGroup(this.game, this.litleExplosions, this.bigExplosions); //Joueurs


        var that = this;
        this.theAliens.onAlienHitPlayer(function (context) {
            console.log("Player Hit : " + JSON.stringify(context));
            that.remoteInput.send(context.id, { state: 'hit', lives: context.lives });//ENVOIE JOUEUR TOUCHE
        });

        this.theAliens.onAlienKillPlayer(function (context) {
            console.log("Player Kill : " + JSON.stringify(context));

            that.remoteInput.send(context.id, { state: 'kill' });//ENVOIE JOUEUR TUE !
            //remoteInput.broadcast({ state: 'team', player: thePlayers.countLiving() });//ENVOIE NOMBRE DE JOUEUR ENCORE DANS LA PARTIE

            if (that.thePlayers.countLiving() < 1) {
                that.stateText.text = " GAME OVER";
                that.stateText.visible = true;
                that._newGame();
            }
        });

        this.thePlayers.onPlayerHitAlien(function (context) {
            var player = that.thePlayers.players.item(context.id);
            if (player) {
                player.score += context.point;
                player.joystick.send({ state: 'score', score: player.score });//ENVOIE NOUVEAU SCORE JOUEUR
            }
            if (that.theAliens.countLiving() == 0) {
                that.theAliens.clearAttack();

                //Cherche le vainqueur
                var winner = that.thePlayers.winner();
                that.remoteInput.send(winner.player.id, { state: 'win', score: winner.score, index: winner.player.index });

                that.stateText.text = "WINNER IS ";
                that.stateText.x = that.world.centerX / 2;
                that.game.add.image(that.world.centerX, 200, SpaceInvaders.Ship.PlayersImg[winner.player.index]);
                that.stateText.visible = true;

                that._newGame();
            }
        });

        this.thePlayers.onPlayersCollide(function (context) { //ENVOIE COLLISION ENTRE JOUEURS
            that._sendPlayerCollide(context.A);
            that._sendPlayerCollide(context.B);
        });

        this.thePlayers.onPlayerStartGame(function (context) {
            if (!that.gameStarted) {
                that.gameStarted = true;

                //that.game.clearQR(); //QR Code sur page d'accueil

                that.stateText.visible = false;
                that.title.visible = false;

                //that.starfield.visible = true;

                that.remoteInput.broadcast({ state: 'start', player: that.thePlayers.countLiving() });//ENVOIE A TOUS LES JOUEUR START GAME

                that.theAliens.clearAttack();
                that.theAliens.startAttack();
            }
        });

        this.remoteInput.onNewRemote(function (context) {
            console.log('REMOTE :' + context.id + ' index : ' + context.index + ' - ' + context.joystick.stringify());

            if (!that.gameStarted) {
                var player = that.thePlayers.createNewPLayer(context.id, context.joystick)
                if (player) {
                    that.theAliens.clearAttack();
                    context.joystick.send({ state: 'ready', score: 0, lives: player.lives, index: player.index });//ENVOIE LES INFORMATIONS POUR LA PARTIE AU JOUEUR
                    that._showPLayerCount();//ENVOIE LE NOMBRE DE JOUEUR CONNECTE
                }
                else {
                    context.joystick.send({ state: 'close', why: 'full' });//ENVOIE LE REFUS POUR ENTRER DANS LA PARTIE
                }
            }
            else {
                context.joystick.send({ state: 'close', why: 'started' });//ENVOIE LE REFUS POUR ENTRER DANS LA PARTIE
            }

        });

        this.remoteInput.onClearRemote(function (context) {
            console.log('CLEAR REMOTE :' + context.id);
            that.thePlayers.remove(context.id);
            that._showPLayerCount();//ENVOIE LE NOMBRE DE JOUEUR CONNECTE
        });
    },

    preload: function () {
        console.log('PRELOAD GAME');

        this.theAliens.preload();
        this.bigExplosions.preload('/assets/explode.png', 128, 128);
        this.litleExplosions.preload('/assets/explosion64_2.png', 64, 64);

        this.thePlayers.preload();
        this.load.image('starfield', '/assets/starfield.png');
        this.game.load.image('title', '/assets/Title.png');

        this.load.image('fusee_Bleu', '/assets/fusee_Bleu.png');
        this.load.image('fusee_Jaune', '/assets/fusee_Jaune.png');
        this.load.image('fusee_Rouge', '/assets/fusee_Rouge.png');
        this.load.image('fusee_Vert', '/assets/fusee_Vert.png');
        this.load.image('fusee_Violet', '/assets/fusee_Violet.png');
        this.load.image('fusee_Gris', '/assets/fusee_Gris.png');
    },

    create: function () {
        console.log('CREATE GAME');

        this.gameStarted = false;

        //this.remoteInput.connect();

        this.stage.setBackgroundColor(0xffffff);
        //this.stage.setBackgroundColor(0xff0000);
        this.physics.startSystem(Phaser.Physics.ARCADE);

        //Le fond qui scroll de haut en bas
        this.starfield = this.add.tileSprite(0, 0, 1080, 1920, 'starfield');

        this.theAliens.create(this.litleExplosions, this.bigExplosions);
        this.thePlayers.create();

        //  Texte
        this.stateText = this.add.text(this.world.centerX, 200, ' connect to WiFi\r\nand scan NFC tag.', { font: '80px Arial', fill: '#ffc600' });
        this.stateText.anchor.setTo(0.5, 0);
        this.stateText.visible = true;

        //TITRE
        this.title = this.game.add.image(this.world.centerX, this.world.centerY, 'title');
        this.title.anchor.setTo(0.5, 0);
        this.title.visible = true;

        //this.starfield.visible = false;

        // Explosion
        this.litleExplosions.create();
        this.bigExplosions.create();

        //this.game.activeQR(); //QRcode sur ma page d'acceuil
    },
    update: function () {
        //  Scroll le fond
        this.starfield.tilePosition.y += 2;

        //PLAYERS
        this.thePlayers.update(this.theAliens);
        this.theAliens.updateAutoCollide();//Collision entre aliens
    },
    render: function () {


        //this.game.debug.bodyInfo(this.theAliens.aliens.children[3], 50, 400);
        //this.game.debug.body(this.theAliens.aliens.children[3]);



        //this.debug.bodyInfo(theAliens.aliens.children[4], 50, 500);
        //this.debug.body(theAliens.aliens.children[4]);
        //for (var i = 0; i < theAliens.aliens.length; i++)
        // {
        //    this.debug.body(theAliens.aliens.children[i]);
        // }


        //for (var i = 0; i < thePlayers.playersGroup.length; i++)
        // {
        //    this.debug.body(thePlayers.playersGroup.children[i]);
        //}

        //for (var i = 0; i < litleExplosions.explosions.length; i++)
        //{
        //    this.debug.body(litleExplosions.explosions.children[i]);
        //}
    //},
    //shutdown: function () {
    //    console.log('SHUTDOWN');
    }
    //#endregion
};


SpaceInvaders.Result = function (game) {

};



SpaceInvaders.Result.prototype = {
    init: function () {

    },
    preload: function () {
        console.log('PRELOAD SCORE');
        //this.load.image('fusee_Bleu', 'assets/fusee_Bleu.png');
        //this.load.image('fusee_Jaune', 'assets/fusee_Jaune.png');
        //this.load.image('fusee_Rouge', 'assets/fusee_Rouge.png');
        //this.load.image('fusee_Vert', 'assets/fusee_Vert.png');
        //this.load.image('fusee_Violet', 'assets/fusee_Violet.png');
        //this.load.image('fusee_Gris', 'assets/fusee_Gris.png');
    },
    create: function () {
        console.log('CREATE SCORE');
        this.stage.setBackgroundColor(0xffffff);
        //Le fond qui scroll de haut en bas
        this.starfield = this.add.tileSprite(0, 0, 1080, 1920, 'starfield');

        this.add.text(this.world.centerX, 200, 'SCORE', { font: '90px Arial', fill: '#ffc600', align: 'center' }).anchor.setTo(0.5, 0);;

        //this.game.add.image(this.world.centerX / 2, 300, 'fusee_Jaune');
        //this.game.add.image(this.world.centerX / 2, 500, 'fusee_Rouge');
        //this.game.add.image(this.world.centerX / 2, 700, 'fusee_Vert');
        //this.game.add.image(this.world.centerX / 2, 900, 'fusee_Violet');
        //this.game.add.image(this.world.centerX / 2, 1100, 'fusee_Gris');


        var index = 0;
        var that = this;
        this.game.thePlayers.players.forEach(function (player) {
            that.game.add.image(that.world.centerX / 2, 400 + (index * 200), SpaceInvaders.Ship.PlayersImg[index]);
            that.add.text(that.world.centerX, 400 + (index * 200), player.score.toString(), { font: '80px Arial', fill: '#ffc600' });
            index += 1;
        });

        //that.game.remoteInput.close();

        setTimeout(function () {
            console.log('END OF GAME');
            that.game.remoteInput.close(); //Pour envoyer un evenement au server pour déclencher le Trigger

            that.game.state.start("game");
        }, 15000);
    },
    update: function () {
        //  Scroll le fond
        this.starfield.tilePosition.y += 2;
    }
};
//#endregion
