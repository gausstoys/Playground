(function() {
    var gs;

    // canvas size
    var maxW = 1000;
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    if (w > maxW) w = maxW;
    if (w * 2/3 > h) {
        w = h * 3/2;
    } else {
        h = w * 2/3;
    }
    var objScale = w/maxW/2;
    var margin = 30 * objScale;
    var game = new Phaser.Game(w, h, Phaser.AUTO, "", { preload: preload, create: create, update: update, pauseUpdate: pauseUpdate });
    var time = new Phaser.Time(game);

    // game logic
    var gameStart = false;
    var gameOver = false;
    var first = true;
    var balanced = false;
    var balanceCnt = 0;
    var imbalanceCnt = 0;

    // game score
    var score = 0;
    var startTime;

    // game objects
    var bgImg;
    var bgTween;
    var pilot;
    var meter;
    var warning;

    // rotate angle
    var lastAngle = 0;
    var UNIT_ANGLE = 25;
    var MAX_ANGLE = 90;
    var MAX_VELOCITY = 50;

    // tutorial objects
    var graphics;
    var tutorial;
    var tutorialTxt;
    var tutorialDestroyed = false;

    // keys
    var spaceKey;
    var cursors;

    // text objects
    var startTxt;
    var scoreTxt;
    var ggTxt;
    var ggScoreTxt;
    var connectTxt;

    function preload() {
        game.load.image("bg", "img/ex05-00.png");
        game.load.image("pilot", "img/ex05-02.png");
        game.load.image("horiz", "img/ex05-03.png");
        game.load.image("meter", "img/ex05-04.png");
        game.load.image("tutorial", "img/tutorial-rotation.png")
    }

    function create() {
        gs = new GaussSense();

        // add background image
        bgImg = game.add.sprite(w / 2, h * 0.8, "bg");
        bgImg.width = w;
        bgImg.height *= w/bgImg.width;
        bgImg.anchor.set(0.5, 0.7);
        game.physics.arcade.enable(bgImg);

        // add pilot
        pilot = game.add.image(w / 2, h * 0.7, "pilot");
        pilot.width = w;
        pilot.height = h;
        pilot.anchor.set(0.5, 0.7);
        meter = game.add.image(w / 2, h * 0.7, "meter");
        var ratio = meter.height/meter.width;
        meter.width = w * 0.82;
        meter.height = meter.width * ratio;
        meter.anchor.set(0.5, 0);

        // Red warning mask
        warning = game.add.graphics(0, 0);
        // warning.lineStyle(30 * objScale, 0xfdcf58, 1);
        warning.beginFill(0xFF0000, 0.2);
        warning.drawRect(0, 0, w, h);
        warning.endFill();
        warning.visible = false;

        // add tutorial
        graphics = game.add.graphics(0, 0);
        graphics.lineStyle(30 * objScale, 0xfdcf58, 1);
        graphics.beginFill(0xFFFFFF, 1);
        graphics.drawRoundedRect(w * 0.15, h * 0.25, w * 0.7, h * 0.65, 10 * objScale);
        graphics.endFill();

        tutorial = game.add.image(w * 0.2, h * 0.5, "tutorial");
        tutorial.width *= objScale * 1.2;
        tutorial.height *= objScale * 1.2;
        tutorial.anchor.set(0, 0.5);

        var tutorialTxtStyle = { fill: "#404040", align: "left", fontSize: 60 * objScale };
        tutorialTxt = game.add.text(w * 0.4, h * 0.5,
            "ROTATE THE MAGNET TO\nSTAY BALANCED ON \nYOUR JOURNEY.", tutorialTxtStyle);
        tutorialTxt.anchor.set(0, 0.5);

        // register key events
        spaceKey = game.input.keyboard.addKey(32);

        // add display texts
        var startTxtStyle = { fill: "#fdcf58", align: "center", fontSize: 60 * objScale };
        startTxt = game.add.text(game.world.centerX, game.world.centerY + 400*objScale, "PRESS \"SPACE\" TO START", startTxtStyle);
        startTxt.anchor.set(0.5);
        startTxt.visible = false;
        var scoreTxtStyle = { fill: "#fff000", align: "right", fontStyle: "italic", fontSize: 140 * objScale };
        scoreTxt = game.add.text(w - 150*objScale, 150 * objScale, "", scoreTxtStyle);
        scoreTxt.anchor.set(0.5);
        scoreTxt.visible = false;
        var ggTxtStyle = { fill: "#fdcf58", align: "center", fontSize: 120 * objScale };
        ggTxt = game.add.text(game.world.centerX, game.world.centerY, "GAME OVER", ggTxtStyle);
        ggTxt.anchor.set(0.5);
        ggTxt.visible = false;
        var ggScoreTxtStyle = { fill: "#fdcf58", align: "center", fontSize: 100 * objScale };
        ggScoreTxt = game.add.text(game.world.centerX, game.world.centerY + 200*objScale, "", ggScoreTxtStyle);
        ggScoreTxt.anchor.set(0.5);
        ggScoreTxt.visible = false;
        var connectTxtStyle = { fill: "#ffffff", align: "center", fontSize: 80 * objScale };
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
            bgImg.body.angularVelocity = 0;
            return;
        } else {
            connectTxt.visible = false;
        }

        if (gameStart) {
            if (!tutorialDestroyed) {
                destroyTutorial();
            }

            var mid = gs.getBipolarMidpoint();

            var ang = mid.angle*180/Math.PI;
            if (Math.abs(ang) > 10) {
                if (bgImg.angle > 80) {
                    ang = (ang < 0)? 0 : ang;
                } else if (bgImg.angle < -80) {
                    ang = (ang > 0)? 0 : ang;
                }
                bgImg.angle -= ang/100;
            }

            if (first) {
                game.time.events.add(Phaser.Timer.SECOND * 2, createRotation, this);
                first = false;
            }

            // check if angle exceed 80 or -80
            if (bgImg.angle > 80) {
                bgImg.body.angularVelocity = -Math.abs(bgImg.body.angularVelocity);
            } else if (bgImg.angle < -80) {
                bgImg.body.angularVelocity = Math.abs(bgImg.body.angularVelocity);
            }

            // check balance
            checkBalance();

            // show score
            var now = new Date();
            if (now - startTime > 2000) {
                startTime = new Date();
                scoreTxt.text = ++score + " ";
            }
            game.world.bringToTop(scoreTxt);

        } else if (gameOver) {
            showGameOver();

            if (bgImg.angle > 45) {
                bgImg.body.angularVelocity = -5;
            } else if (bgImg.angle < -45) {
                bgImg.body.angularVelocity = 5;
            }

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
        gameStart = true;
        gameOver = false;
        first = true;
        bgImg.angle = 0;
        bgImg.body.angularVelocity = 0;

        warning.visible = false;
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

    function destroyTutorial() {
        graphics.destroy();
        tutorial.destroy();
        tutorialTxt.destroy();
        tutorialDestroyed = true;
    }

    function createRotation() {
        var baseVelocity = (score + 5 > MAX_VELOCITY)? MAX_VELOCITY : score + 5;
        bgImg.body.angularVelocity = Math.sign(Math.random() - 0.5) * (Math.random()*baseVelocity + 5);

        if (gameStart) {
            game.time.events.add(Phaser.Timer.SECOND * (Math.random()*(4-baseVelocity/MAX_VELOCITY/2)+1), createRotation, this);
        }
    }

    function checkBalance() {
        balanced = (Math.abs(bgImg.angle) < 5)? true : false;
        if (!balanced) {
            balanceCnt = 0;
            imbalanceCnt++;
        } else {
            balanceCnt++;
            if (balanceCnt > 10) {
                imbalanceCnt = 0;
                warning.visible = false;
            }
        }
        if (imbalanceCnt > 100) {
            if (imbalanceCnt % 10 == 0) {
                warning.visible = !warning.visible;
            }
        }
        if (imbalanceCnt > 300) {
            warning.visible = true;
            imbalanceCnt = 0;
            balanceCnt = 0;
            onShuttleCrashed();
        }
    }

    function onShuttleCrashed() {
        gameOver = true;
        gameStart = false;
    }

})();
