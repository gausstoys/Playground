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
    var bgImg;
    var bgTween;
    var pilot;
    var meter;

    var UNIT_ANGLE = 25;
    var MAX_ANGLE = 90;
    var angleMatched = false;

    var explosions = [];

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
        game.load.spritesheet("explosion", "img/explosions.png", 64, 64);
    }

    function create() {
        gs = new GaussSense();

        // add background image
        bgImg = game.add.image(w / 2, h * 0.7, "bg");
        bgImg.width = w;
        bgImg.height = h;
        bgImg.anchor.set(0.5, 0.7);

        // add pilot
        pilot = game.add.image(w / 2, h * 0.7, "pilot");
        pilot.width = w;
        pilot.height = h;
        pilot.anchor.set(0.5, 0.7);

        // var horiz = game.add.image(w / 2, h * 0.7, "horiz");
        // var ratio = horiz.height/horiz.width;
        // horiz.width = w * 0.82;
        // horiz.height = horiz.width * ratio;
        // horiz.anchor.set(0.5);

        meter = game.add.image(w / 2, h * 0.7, "meter");
        var ratio = meter.height/meter.width;
        meter.width = w * 0.82;
        meter.height = meter.width * ratio;
        meter.anchor.set(0.5, 0);

        bgTween = game.add.tween(bgImg).to({ angle: Math.random()*UNIT_ANGLE*2 - UNIT_ANGLE }, 1000, Phaser.Easing.Quadratic.InOut, false, 0, 0, false);
        bgTween.onComplete.add(bgRotateComplete);

        // register key events
        spaceKey = game.input.keyboard.addKey(32);

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

            var mid = gs.getBipolarMidpoint();
            // console.log(north.x, north.y);

            // shuttle movements
            pilot.rotation = mid.angle;
            meter.rotation = mid.angle;
            angleMatched = (Math.abs(pilot.angle - bgImg.angle) < 5)? true : false;

            // start creating rocks
            if (first) {
                // game.time.events.add(Phaser.Timer.SECOND * 2, createRock, this);
                bgTween.start();
                first = false;
            }

            // check collision

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
            game.world.bringToTop(ggTxt);
            game.world.bringToTop(ggScoreTxt);
            game.world.bringToTop(startTxt);

            ggTxt.visible = true;
            ggScoreTxt.text = "SCORE: " + score;
            ggScoreTxt.visible = true;
            game.time.events.add(Phaser.Timer.SECOND * 5, function() {
                if (!gameStart) startTxt.visible = true;
            }, this);
        }
    }

    function bgRotateComplete() {
        game.time.events.add(Phaser.Timer.SECOND * 1, function () {
            if (!angleMatched) {
                console.log("not matched");
                onShuttleCrashed();
            } else {
                var angle = 0;
                if (bgImg.angle > MAX_ANGLE) {
                    angle = -Math.random()*UNIT_ANGLE;
                } else if (bgImg.angle < -MAX_ANGLE) {
                    angle = Math.random()*UNIT_ANGLE;
                } else {
                    angle = Math.random()*UNIT_ANGLE*2 - UNIT_ANGLE;
                }
                bgTween = game.add.tween(bgImg).to({ angle: angle }, 1000, Phaser.Easing.Quadratic.InOut, true, 0, 0, false);
                bgTween.onComplete.add(bgRotateComplete);
            }
        });
    }

    function onShuttleCrashed() {
        // shuttle.body.velocity.x = 0;
        // shuttle.body.velocity.y = 0;
        // if (!gameOver) {
        //     var exp1 = [];
        //     for (var i = 0; i < 16; i++) exp1.push(i+32);
        //     for (var i = 0; i < 30; i++) {
        //         game.time.events.add(Phaser.Timer.SECOND * (Math.random()*2), function() {
        //             var midX = shuttle.x + shuttle.width / 2;
        //             var midY = shuttle.y + shuttle.height / 2;
        //             var posX = midX + (Math.random()-0.8) * shuttle.width * 1.2;
        //             var posY = midY + (Math.random()-0.8) * shuttle.height * 1.2;
        //             var explosion = game.add.sprite(posX, posY, "explosion", 32);
        //             explosion.width *= Math.random() + 1;
        //             explosion.height = explosion.width;
        //             explosion.animations.add("exp1", exp1, 10, false);
        //             explosion.play("exp1");
        //             explosions.push(explosion);
        //         }, this);
        //     }
        // }
        gameOver = true;
        gameStart = false;
    }

})();
