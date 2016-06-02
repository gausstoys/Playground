(function() {
    var gs;
    var MAX_INTENSITY = 30;

    // game UI
    var maxW = 1000;
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    if (w > maxW) w = maxW;
    if (w * 2/3 > h) {
        w = h * 3/2;
    }
    var objScale = w/maxW/2;
    var rockScale = objScale * 1.4;
    var margin = 10;

    // Phaser objects
    var game = new Phaser.Game(w, h, Phaser.AUTO, "", { preload: preload, create: create, update: update });
    var time = new Phaser.Time(game);

    // game logic
    var gameStart = false;
    var gamePaused = false;
    var gameOver = false;
    var first = true;
    var buffer = 0;

    // game score
    var score = 0;
    var startTime;


    // game objects
    var bgImg1, bgImg2;
    var shuttle;
    var rocks = [];
    var explosions = [];
    var MAX_VELOCITY = 200;
    var rockUpTimerEvent;
    var rockDownTimerEvent;

    // keys
    var spaceKey;

    // text objects
    var startTxt;
    var scoreTxt;
    var ggTxt;
    var ggScoreTxt;
    var connectTxt;

    function preload() {
        game.load.image("bg-1", "img/ex03-01.png");
        game.load.image("shuttle", "img/ex03-03.png");
        game.load.image("rock-up-1", "img/ex03-04.png");
        game.load.image("rock-up-2", "img/ex03-05.png");
        game.load.image("rock-down-1", "img/ex03-06.png");
        game.load.image("rock-down-2", "img/ex03-07.png");
        game.load.spritesheet("explosion", "img/explosions.png", 64, 64);
    }

    function create() {
        gs = new GaussSense();

        game.physics.startSystem(Phaser.Physics.P2JS);

        // add background image
        bgImg1 = game.add.image(w/2, h/2, "bg-1");
        bgImg1.width = w * 1.2;
        bgImg1.height = h;
        bgImg1.anchor.set(0.5);
        bgImg2 = game.add.image(w/2 + bgImg1.width - margin * objScale, h/2, "bg-1");
        bgImg2.width = w * 1.2;
        bgImg2.height = h;
        bgImg2.anchor.set(0.5);
        // note that the width of bgImg would become negative
        bgImg2.scale.x *= -1;

        // add space shuttle
        shuttle = game.add.sprite(0, 0, "shuttle");
        shuttle.name = "shuttle";
        shuttle.width *= objScale;
        shuttle.height *= objScale;
        shuttle.x = shuttle.width;
        shuttle.y = h/2;
        // space shuttle physics
        game.physics.p2.enableBody(shuttle, false);
        shuttle.body.motionState = Phaser.KINEMATIC;
        shuttle.body.width /= 2;
        shuttle.body.allowGravity = false;
        shuttle.body.damping = 0;
        shuttle.body.clearShapes();
        shuttle.body.addCircle(shuttle.height * 0.5);
        shuttle.body.onBeginContact.add(onShuttleCrashed, this);

        // rockUpTimerEvent = game.time.events.loop(game.rnd.integerInRange(2000, 5000), createRockUp, this);
        // rockDownTimerEvent = game.time.events.loop(game.rnd.integerInRange(2000, 5000), createRockDown, this);
        // rockUpTimerEvent.loop = false;
        // rockDownTimerEvent.loop = false;

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

    function update() {
        if (gs.isConnected()) {
            connectTxt.visible = false;
            if (gamePaused) {
                resumeGame();
            }
        } else {
            connectTxt.visible = true;
            if (gameStart) {
                pauseGame();
            }
            return;
        }

        if (gameStart) {
            moveBgImg();

            var mid = gs.getBipolarMidpoint();
            // console.log("Midpoint Intensity: ", mid.intensity);

            // shuttle movements
            if (mid.intensity > 0) {
                moveShuttle(mid.intensity);
            } else {
                buffer = 0;
                shuttle.body.velocity.y = 0;
                if (shuttle.y > h/2 + margin*objScale) shuttle.body.velocity.y = -100;
                if (shuttle.y < h/2 - margin*objScale) shuttle.body.velocity.y = 100;
            }

            // start creating rocks
            if (first) {
                first = false;
                // game.time.events.add(Phaser.Timer.SECOND * Math.random()*3, createRockUp, this);
                // game.time.events.add(Phaser.Timer.SECOND * Math.random()*3, createRockDown, this);
                rockUpTimerEvent = game.time.events.loop(game.rnd.integerInRange(2000, 5000), createRockUp, this);
                rockDownTimerEvent = game.time.events.loop(game.rnd.integerInRange(2000, 5000), createRockDown, this);
                // rockUpTimerEvent.loop = true;
                // rockDownTimerEvent.loop = true;
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
            rockUpTimerEvent.loop = false;
            rockDownTimerEvent.loop = false;

            shuttle.body.velocity.y = 0;
            for (var i = 0; i < rocks.length; i++) rocks[i].body.velocity.x = 0;

            showGameOver();

            // Game starting
            if (spaceKey.isDown) {
                resetGame();
            }

        } else {

            startTxt.visible = true;
            // Game Starting
            if (spaceKey.isDown) {
                resetGame();
            }

        }
    }

    function resumeGame() {
        gamePaused = false;
        rockUpTimerEvent.loop = true;
        rockDownTimerEvent.loop = true;
        var v = Math.floor(score/10) * 10 + 100;
        for (var i = 0; i < rocks.length; i++) rocks[i].body.velocity.x = (v > MAX_VELOCITY)? -MAX_VELOCITY : -v;
    }

    function pauseGame() {
        gamePaused = true;
        rockUpTimerEvent.loop = false;
        rockDownTimerEvent.loop = false;
        game.world.bringToTop(connectTxt);
        for (var i = 0; i < rocks.length; i++) rocks[i].body.velocity.x = 0;
    }

    function resetGame() {
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].destroy();
        }
        for (var i = 0; i < rocks.length; i++) {
            rocks[i].destroy();
        }
        rocks = [];
        shuttle.x = shuttle.width;
        shuttle.y = h / 2;

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

    function moveBgImg() {
        bgImg1.x -= 0.4;
        bgImg2.x -= 0.4;
        if (bgImg1.x < -bgImg1.width/2) {
            bgImg1.x = bgImg2.x + bgImg1.width - margin * objScale;
        } else if (bgImg2.x < bgImg2.width/2) {
            bgImg2.x = bgImg1.x + bgImg1.width - margin * objScale;
        }
    }

    function createRockUp() {
        var rockTypes = ["up-1", "up-2"];
        var rockPolygon = {
            "up-1": [[-150*rockScale, -240*rockScale], [150*rockScale, -240*rockScale], [0, 200*rockScale]],
            "up-2": [[-120*rockScale, -160*rockScale], [120*rockScale, -160*rockScale], [0, 130*rockScale]]
        };
        var idx = Math.floor(Math.random() * rockTypes.length);

        var rock = game.add.sprite(0, 0, "rock-" + rockTypes[idx]);
        rock.width *= objScale * 1.2;
        rock.height *= objScale * 1.2;
        rock.x = w + rock.width/2;
        rock.y = rock.height/2 - margin*objScale;

        game.physics.p2.enableBody(rock, false);
        rock.body.motionState = Phaser.KINEMATIC;
        rock.body.clearShapes();
        rock.body.addPolygon({
            "optimalDecomp": false,
            "skipSimpleCheck": true,
            "removeCollinearPoints": false
        }, rockPolygon[rockTypes[idx]]);
        rock.body.damping = 0;
        rock.body.allowGravity = false;

        var v = Math.floor(score/10) * 10 + 100;
        rock.body.velocity.x = (v > MAX_VELOCITY)? -MAX_VELOCITY : -v;

        rocks.push(rock);

        // if (gameStart) {
        //     game.time.events.add(Phaser.Timer.SECOND * (Math.random()*4+1.5), createRockUp, this);
        // }
    }

    function createRockDown() {
        var rockTypes = ["down-1", "down-2"];
        var rockPolygon = {
            "down-1": [[-150*rockScale, 220*rockScale], [150*rockScale, 220*rockScale], [0, -200*rockScale]],
            "down-2": [[-120*rockScale, 140*rockScale], [120*rockScale, 140*rockScale], [0, -120*rockScale]]
        };

        var idx = Math.floor(Math.random() * rockTypes.length);
        var rock = game.add.sprite(0, 0, "rock-" + rockTypes[idx]);
        rock.width *= rockScale;
        rock.height *= rockScale;
        rock.x = w + rock.width/2;
        rock.y = h - rock.height/2 + margin*objScale;

        game.physics.p2.enableBody(rock, false);
        rock.body.motionState = Phaser.KINEMATIC;
        rock.body.clearShapes();
        rock.body.addPolygon({
            "optimalDecomp": false,
            "skipSimpleCheck": true,
            "removeCollinearPoints": false
        }, rockPolygon[rockTypes[idx]]);
        game.physics.arcade.enable(rock);
        rock.body.allowGravity = false;
        rock.body.damping = 0;

        var v = Math.floor(score/10) * 10 + 100;
        rock.body.velocity.x = (v > MAX_VELOCITY)? -MAX_VELOCITY : -v;

        rocks.push(rock);

        // if (gameStart) {
        //     game.time.events.add(Phaser.Timer.SECOND * (Math.random()*4+1.5), createRockDown, this);
        // }
    }

    function moveShuttle(intensity) {
        if (intensity > MAX_INTENSITY) intensity = MAX_INTENSITY;

        buffer++;
        if (buffer > 15) {
            var newY = h/2 + (Math.round(intensity)-MAX_INTENSITY/2)/MAX_INTENSITY * shuttle.height*4;
            if (Math.abs(shuttle.y - newY) > 1) {
                shuttle.body.y = newY;
            }
        }
    }

    function onShuttleCrashed() {
        if (!gameOver) {
            var exp = [];
            for (var i = 0; i < 16; i++) exp.push(i+32);
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
