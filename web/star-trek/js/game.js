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
    var game = new Phaser.Game(w, h, Phaser.AUTO, "", { preload: preload, create: create, update: update });
    var time = new Phaser.Time(game);

    // game logic
    var gameStart = false;
    var first = true;
    var gameOver = false;

    // game objects
    var shuttle;
    var rocks = [];
    var explosions = [];
    var margin = 10;

    // keys
    var spaceKey;
    var cursors;

    // text objects
    var startTxt;
    var ggTxt;
    var connectTxt;

    function preload() {
        game.load.image("rock", "img/ex01-03.png");
        game.load.image("shuttle", "img/ex01-02.png");
        game.load.image("bg", "img/ex01-01.png");
        game.load.spritesheet("explosion", "img/explosions.png", 64, 64);
    }

    function create() {
        gs = new GaussSense();

        // add background image
        var bgImg = game.add.image(0, 0, "bg");
        bgImg.width = w;
        bgImg.height = h;

        // add space shuttle
        shuttle = game.add.sprite(50, 100, "shuttle");
        shuttle.width *= 0.5;
        shuttle.height *= 0.5;
        console.log(shuttle.height);
        game.physics.arcade.enable(shuttle);
        shuttle.body.setCircle(shuttle.height*0.8, (shuttle.width-shuttle.height*0.8)*0.5, 0);

        // register key events
        spaceKey = game.input.keyboard.addKey(32);
        cursors = game.input.keyboard.createCursorKeys();

        // add display texts
        var startTxtStyle = { fill: "#fff000", align: "center" };
        startTxt = game.add.text(game.world.centerX, game.world.centerY + 100, "PRESS \"SPACE\" TO START", startTxtStyle);
        startTxt.anchor.set(0.5);
        startTxt.visible = false;

        var ggTxtStyle = { fill: "#fff000", align: "center", fontSize: "64px" };
        ggTxt = game.add.text(game.world.centerX, game.world.centerY, "GAME OVER", ggTxtStyle);
        ggTxt.anchor.set(0.5);
        ggTxt.visible = false;

        var connectTxtStyle = { fill: "#ffffff", align: "center", fontSize: "40px" };
        connectTxt = game.add.text(game.world.centerX, 100, "GaussSense is not detected", connectTxtStyle);
        connectTxt.anchor.set(0.5);
        connectTxt.visible = false;
    }

    function update() {

        if (gs.isConnected()) {
            connectTxt.visible = false;
        } else {
            connectTxt.visible = true;
            return;
        }


        if (gameStart) {

            var north = gs.getNorthPoint();
            console.log(north.x, north.y);

            // shuttle movements
            if ((north.y < 0.3 && north.y > 0 || cursors.up.isDown) && shuttle.y > margin) {
                shuttle.y -= 4;
            }
            if ((north.y > 0.7 || cursors.down.isDown) && shuttle.y < h - shuttle.height - margin) {
                shuttle.y += 4;
            }
            if ((north.x > 0.7 || cursors.right.isDown) && shuttle.x < w - shuttle.width - margin) {
                shuttle.x += 4;
            }
            if ((north.x < 0.3 && north.x > 0 || cursors.left.isDown) && shuttle.x > margin) {
                shuttle.x -= 4;
            }

            // start creating rocks
            if (first) {
                game.time.events.add(Phaser.Timer.SECOND * 5, createRock, this);
                first = false;
            }

            // check collision
            var rocksObj = [];
            for (var i = 0; i < rocks.length; i++) rocksObj.push(rocks[i]["object"]);
            game.physics.arcade.overlap(shuttle, rocksObj, onShuttleCrashed);

            for (var i = 0; i < explosions.length; i++) {
               explosions[i].destroy();
            }

        } else if (gameOver) {

            if (!ggTxt.visible) {
                ggTxt.visible = true;
                game.time.events.add(Phaser.Timer.SECOND * 5, function() {
                    if (!gameStart) startTxt.visible = true;
                }, this);
            }

            if (spaceKey.isDown) {
                console.log("Game starting");
                resetGame();
            }

        } else {

            startTxt.visible = true;
            if (spaceKey.isDown) {
                console.log("Game starting");
                resetGame();
            }

        }

        // rocks movements
        for (var i = 0; i < rocks.length; i++) {
            var rock = rocks[i];
            rock["object"].x -= rock["speed"];
            if (rock["object"].x < -rock["object"].width * 1.25 - margin) {
                rock["object"].destroy();
                rocks.splice(i, 1);
                i--;
            }
        }
    }

    function resetGame() {
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].destroy();
        }
        shuttle.x = 50;
        shuttle.y = 100;
        gameStart = true;
        first = true;
        gameOver = false;
        startTxt.visible = false;
        ggTxt.visible = false;
    }

    function createRock() {
        console.log("creating rock!");

        var rock = game.add.sprite(w, Math.random() * h, "rock");
        var aspectRatio = rock.height/rock.width;
        rock.width = rock.width * (Math.random() / 2 + 0.5);
        rock.height = rock.width * aspectRatio;
        game.physics.arcade.enable(rock);
        rock.body.setSize(rock.width*0.8, rock.height*0.8, rock.width*0.1, rock.height*0.1);
        rocks.push({
            "object": rock,
            "speed": Math.random()*2 + 1
        });

        if (gameStart) {
            game.time.events.add(Phaser.Timer.SECOND * (Math.random()*3+1), createRock, this);
        }
    }

    function onShuttleCrashed() {
        console.log("shuttle crashed!");

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