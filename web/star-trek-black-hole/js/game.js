(function() {
    var gs;

    // canvas size
    var maxW = 1000;
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    if (w > maxW) w = maxW;
    if (w * 2/3 > h) {
        w = h * 3/2;
    }
    var objScale = w/maxW/2;
    var margin = 30 * objScale;
    var game = new Phaser.Game(w, h, Phaser.AUTO, "", { preload: preload, create: create, update: update, pauseUpdate: pauseUpdate });
    var time = new Phaser.Time(game);

    // game logic
    var gameStart = false;
    var gameOver = false;
    var first = true;

    // game score
    var score = 0;
    var startTime;

    // game objects
    var hole;
    var holeTween;
    var holeMaxScaleY;

    var shuttle;
    var shuttleTween;
    var shuttleMaxScaleX;
    var shuttleMaxScaleY;
    var shuttlePos = 1;
    var confuseStartTime;

    var explosions = [];

    // keys
    var spaceKey;

    // text objects
    var startTxt;
    var scoreTxt;
    var ggTxt;
    var ggScoreTxt;
    var connectTxt;

    function preload() {
        game.load.image("bg", "img/ex04-01.png");
        game.load.image("hole", "img/ex04-04.png");
        game.load.image("shuttle-n", "img/ex04-02.png");
        game.load.image("shuttle-s", "img/ex04-05.png");
        game.load.image("shuttle-q", "img/ex04-03.png");
        game.load.spritesheet("explosion", "img/explosions.png", 64, 64);
    }

    function create() {
        gs = new GaussSense();

        // add background image
        var bgImg = game.add.image(0, 0, "bg");
        bgImg.width = w;
        bgImg.height = h;

        // add black hole image
        hole = game.add.image(w/2, h/2, "hole");
        hole.width = w;
        hole.height = h;
        hole.anchor.set(0.5);
        holeMaxScaleY = hole.scale.y;
        holeTween = game.add.tween(hole.scale).to({ y: 0.8 * objScale }, 1000, Phaser.Easing.Quadratic.InOut, false, 0, 0, true);
        holeTween.onComplete.add(squeezeBlackHole);

        // add space shuttle
        shuttle = game.add.sprite(w/2, h/2, "shuttle-n");
        shuttle.width *= objScale * 1.2;
        shuttle.height *= objScale * 1.2;
        shuttle.anchor.set(0.5);
        shuttleMaxScaleX = shuttle.scale.x;
        shuttleMaxScaleY = shuttle.scale.y;

        // register key events
        spaceKey = game.input.keyboard.addKey(32);
        cursors = game.input.keyboard.createCursorKeys();

        // add display texts
        var startTxtStyle = { fill: "#fff000", align: "center" };
        startTxt = game.add.text(game.world.centerX, game.world.centerY + 400*objScale, "PRESS \"SPACE\" TO START", startTxtStyle);
        startTxt.anchor.set(0.5);
        startTxt.visible = false;
        var scoreTxtStyle = { fill: "#fff000", align: "right", fontStyle: "italic", fontSize: "80px" };
        scoreTxt = game.add.text(w - 150*objScale, 150 * objScale, "", scoreTxtStyle);
        scoreTxt.anchor.set(0.5);
        scoreTxt.visible = false;
        var ggTxtStyle = { fill: "#fff000", align: "center", fontSize: "64px" };
        ggTxt = game.add.text(game.world.centerX, game.world.centerY, "GAME OVER", ggTxtStyle);
        ggTxt.anchor.set(0.5);
        ggTxt.visible = false;
        var ggScoreTxtStyle = { fill: "#fff000", align: "center", fontSize: "40px" };
        ggScoreTxt = game.add.text(game.world.centerX, game.world.centerY + 200*objScale, "", ggScoreTxtStyle);
        ggScoreTxt.anchor.set(0.5);
        ggScoreTxt.visible = false;
        var connectTxtStyle = { fill: "#ffffff", align: "center", fontSize: "40px" };
        connectTxt = game.add.text(game.world.centerX, 200 * objScale, "GaussSense is not detected", connectTxtStyle);
        connectTxt.anchor.set(0.5);
        connectTxt.visible = false;
    }

    function pauseUpdate() {
        if (gs.isConnected()) {
            connectTxt.visible = false;
            game.paused = false;
        }
    }

    function update() {
        if (!gs.isConnected()) {
            connectTxt.visible = true;
            game.world.bringToTop(connectTxt);
            if (gameStart) {
                game.paused = true;
            }
            return;
        } else {
            connectTxt.visible = false;
        }

        if (gameStart) {

            var north = gs.getNorthPoint();
            var south = gs.getSouthPoint();

            // shuttle movements
            if (north.intensity > 20) {
                changeShuttle(true);
            } else if (south.intensity < -20) {
                changeShuttle(false);
            }
            // console.log(north.x, north.y);

            // shift blackHole
            if (!holeTween.isRunning) {
                holeTween.start();
            }

            // show score
            var now = new Date();
            if (now - startTime > 2000) {
                startTime = new Date();
                scoreTxt.text = ++score + " ";
            }
            game.world.bringToTop(scoreTxt);

            for (var i = 0; i < explosions.length; i++) {
               explosions[i].destroy();
            }

        } else if (gameOver) {
            showGameOver();

            if (spaceKey.isDown) {
                resetGame();
            }
        } else {
            startTxt.visible = true;
            if (spaceKey.isDown) {
                resetGame();
            }
        }
    }

    function resetGame() {
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].destroy();
        }
        shuttle.loadTexture("shuttle-n");
        gameStart = true;
        gameOver = false;
        first = true;
        startTxt.visible = false;
        ggTxt.visible = false;
        ggScoreTxt.visible = false;

        startTime = new Date();
        score = 0;
        scoreTxt.text = score + " ";
        scoreTxt.visible = true;
    }

    function showGameOver() {
        if (!ggTxt.visible) {
            ggTxt.visible = true;
            ggScoreTxt.text = "SCORE: " + score;
            ggScoreTxt.visible = true;
            game.time.events.add(Phaser.Timer.SECOND * 5, function() {
                if (!gameStart) startTxt.visible = true;
            }, this);
        }
        game.world.bringToTop(ggTxt);
        game.world.bringToTop(ggScoreTxt);
        game.world.bringToTop(startTxt);
    }

    function squeezeBlackHole() {
        if (Math.random() < 0.2 + Math.floor(score/5)*0.05) {
            // shift black hole
            holeTween = game.add.tween(hole.scale).to({ y: 0 }, 600, Phaser.Easing.Quadratic.InOut, false, 0, 0, false);
            holeTween.onComplete.add(shiftBlackHole);
            game.time.events.add(Phaser.Timer.HALF, checkShuttlePosition, this);
        } else {
            holeTween = game.add.tween(hole.scale).to({ y: Math.sign(hole.scale.y) * (Math.random()+0.4) * objScale }, 1000, Phaser.Easing.Quadratic.InOut, false, 0, 0, true);
            holeTween.onComplete.add(squeezeBlackHole);
            game.time.events.add(Phaser.Timer.HALF, checkShuttlePosition, this);
        }
    }

    function shiftBlackHole() {
        hole.scale.y *= -1;
        holeMaxScaleY *= -1;
        holeTween = game.add.tween(hole.scale).to({ y: holeMaxScaleY }, 800, Phaser.Easing.Quadratic.OutIn, false, 0, 0, false);
        holeTween.onComplete.add(squeezeBlackHole);
    }

    function changeShuttle(isNorth) {
        if (shuttleTween !== undefined && shuttleTween.isRunning) {
            return;
        }

        if (isNorth) {
            if (shuttlePos !== 1) {
                shuttlePos = 1;
                shuttleTween = game.add.tween(shuttle.scale).to({ y: 0 }, 100, Phaser.Easing.Quadratic.InOut, true, 0, 0, false);
                shuttleTween.onComplete.add(function() {
                    shuttle.loadTexture("shuttle-n");
                    game.add.tween(shuttle.scale).to({ y: shuttleMaxScaleY }, 100, Phaser.Easing.Quadratic.OutIn, true, 0, 0, false);
                });
            }
        } else {
            if (shuttlePos !== -1) {
                shuttlePos = -1;
                shuttleTween = game.add.tween(shuttle.scale).to({ y: 0 }, 100, Phaser.Easing.Quadratic.InOut, true, 0, 0, false);
                shuttleTween.onComplete.add(function() {
                    shuttle.loadTexture("shuttle-s");
                    game.add.tween(shuttle.scale).to({ y: shuttleMaxScaleY }, 100, Phaser.Easing.Quadratic.OutIn, true, 0, 0, false);
                });
            }
        }
    }

    function checkShuttlePosition() {
        if (Math.sign(hole.scale.y) * shuttlePos < 0) {
            if (shuttle.key !== "shuttle-q") {
                confuseStartTime = new Date();
                shuttle.loadTexture("shuttle-q");
            }
            var t = new Date();
            game.add.tween(shuttle.scale).to({ x: shuttleMaxScaleX*1.2 }, 500, Phaser.Easing.Quadratic.InOut, true, 0, 3, true);
            if (t - confuseStartTime > 500 * (3+1)) {
                onShuttleCrashed();
            }
        } else {
            if (shuttlePos === 1) {
                shuttle.loadTexture("shuttle-n");
            } else {
                shuttle.loadTexture("shuttle-s");
            }
        }
    }

    function onShuttleCrashed() {
        if (!gameOver) {
            var exp = [];
            for (var i = 0; i < 16; i++) exp.push(i+64);
            for (var i = 0; i < 30; i++) {
                game.time.events.add(Phaser.Timer.SECOND * (Math.random()*2), function() {
                    var posX = shuttle.x + (Math.random()-0.8) * shuttle.width * 1.2;
                    var posY = shuttle.y + (Math.random()-0.8) * shuttle.height * 1.2;
                    var explosion = game.add.sprite(posX, posY, "explosion", 32);
                    explosion.width *= Math.random() + 1;
                    explosion.height = explosion.width;
                    explosion.animations.add("exp", exp, 10, false);
                    explosion.play("exp");
                    explosions.push(explosion);
                }, this);
            }
        }

        gameOver = true;
        gameStart = false;
    }

})();
