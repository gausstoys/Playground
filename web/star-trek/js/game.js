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
    var shuttle;
    var rocks = [];
    var explosions = [];
    var MAX_VELOCITY = 300;

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
        game.load.image("rock", "img/ex01-03.png");
        game.load.image("shuttle", "img/ex01-02.png");
        game.load.image("bg", "img/ex01-01.png");
        game.load.image("tutorial", "img/tutorial-2d.png");
        game.load.spritesheet("explosion", "img/explosions.png", 64, 64);
    }

    function create() {
        gs = new GaussSense();

        // add background image
        var bgImg = game.add.image(0, 0, "bg");
        bgImg.width = w;
        bgImg.height = h;

        // add space shuttle
        shuttle = game.add.sprite(100 * objScale, 400 * objScale, "shuttle");
        shuttle.width *= objScale;
        shuttle.height *= objScale;
        game.physics.arcade.enable(shuttle);
        shuttle.body.setCircle(shuttle.height*0.8, (shuttle.width-shuttle.height*0.8)*0.5, 0);

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
            "MOVE THE MAGNET IN X/Y\nDIRECTIONS TO CONTROL\nYOUR SHUTTLE.", tutorialTxtStyle);
        tutorialTxt.anchor.set(0, 0.5);

        // register key events
        spaceKey = game.input.keyboard.addKey(32);
        cursors = game.input.keyboard.createCursorKeys();

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
            return;
        } else {
            connectTxt.visible = false;
        }

        if (gameStart) {
            if (!tutorialDestroyed) {
                destroyTutorial();
            }

            var mid = gs.getBipolarMidpoint();
            // console.log(mid.x, mid.y);

            // shuttle movements
            shuttle.body.velocity.x = 0;
            shuttle.body.velocity.y = 0;
            if ((mid.y < 0.3 && mid.y > 0 || cursors.up.isDown) && shuttle.y > margin) {
                shuttle.body.velocity.y = -500 * objScale;
            }
            if ((mid.y > 0.7 || cursors.down.isDown) && shuttle.y < h - shuttle.height - margin) {
                shuttle.body.velocity.y = 500 * objScale;
            }
            if ((mid.x > 0.7 || cursors.right.isDown) && shuttle.x < w - shuttle.width - margin) {
                shuttle.body.velocity.x = 500 * objScale;
            }
            if ((mid.x < 0.3 && mid.x > 0 || cursors.left.isDown) && shuttle.x > margin) {
                shuttle.body.velocity.x = -500 * objScale;
            }

            // start creating rocks
            if (first) {
                game.time.events.add(Phaser.Timer.SECOND * 2, createRock, this);
                first = false;
            }

            // check collision
            game.physics.arcade.overlap(shuttle, rocks, onShuttleCrashed);

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

        // rocks movements
        for (var i = 0; i < rocks.length; i++) {
            if (rocks[i].x < -rocks[i].width * 1.25 - margin) {
                rocks[i].destroy();
                rocks.splice(i, 1);
                i--;
            }
        }
    }

    function resetGame() {
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].destroy();
        }
        shuttle.x = 100 * objScale;
        shuttle.y = 400 * objScale;
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

    function destroyTutorial() {
        graphics.destroy();
        tutorial.destroy();
        tutorialTxt.destroy();
        tutorialDestroyed = true;
    }

    function createRock() {
        var rock = game.add.sprite(w, Math.random() * h, "rock");
        var size = Math.random() + 1;
        rock.width *= objScale * size;
        rock.height *= objScale * size;
        game.physics.arcade.enable(rock);
        rock.body.setSize(rock.width*0.8, rock.height*0.8, rock.width*0.1, rock.height*0.1);

        var baseVelocity = (score + 200 > MAX_VELOCITY)? MAX_VELOCITY : score + 200;
        rock.body.velocity.x = -(Math.random()*200 + baseVelocity) * objScale;
        rocks.push(rock);

        if (gameStart) {
            game.time.events.add(Phaser.Timer.SECOND * (Math.random()*(3-baseVelocity/MAX_VELOCITY/2)+1), createRock, this);
        }
    }

    function onShuttleCrashed() {
        shuttle.body.velocity.x = 0;
        shuttle.body.velocity.y = 0;
        if (!gameOver) {
            var exp1 = [];
            for (var i = 0; i < 16; i++) exp1.push(i+32);
            for (var i = 0; i < 30; i++) {
                game.time.events.add(Phaser.Timer.SECOND * (Math.random()*2), function() {
                    var midX = shuttle.x + shuttle.width / 2;
                    var midY = shuttle.y + shuttle.height / 2;
                    var posX = midX + (Math.random()-0.8) * shuttle.width * 1.2;
                    var posY = midY + (Math.random()-0.8) * shuttle.height * 1.2;
                    var explosion = game.add.sprite(posX, posY, "explosion", 32);
                    explosion.width *= Math.random() + 1;
                    explosion.height = explosion.width;
                    explosion.animations.add("exp1", exp1, 10, false);
                    explosion.play("exp1");
                    explosions.push(explosion);
                }, this);
            }
        }
        gameOver = true;
        gameStart = false;
    }

})();
