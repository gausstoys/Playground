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
    var game = new Phaser.Game(w, h, Phaser.AUTO, "", { preload: preload, create: create, update: update });
    var time = new Phaser.Time(game);

    // game logic
    var gameStart = false;
    var gamePaused = false;
    var first = true;
    var gameOver = false;

    // game objects
    var shuttle;
    var enemies = [];
    var rays = [];
    var explosions = [];
    var margin = 10;

    // keys
    var spaceKey;
    var cursors;

    // text objects
    var startTxt;
    var ggTxt;
    var connectTxt;

    var expIdx = [];
    for (var i = 0; i < 8; i++) {
        var exp = [];
        for (var j = 0; j < 16; j++) exp.push(i*8 + j);
        expIdx.push(exp);
    }

    function preload() {
        game.load.image("shuttle", "img/ex02-01.png");
        game.load.image("enemy", "img/ex02-02.png");
        game.load.image("ray", "img/ex02-03.png");
        game.load.image("bg", "img/ex02-04.png");
        game.load.spritesheet("explosion", "img/explosions.png", 64, 64);
    }

    function create() {
        gs = new GaussSense();

        // add background image
        var bgImg = game.add.image(0, 0, "bg");
        bgImg.width = w;
        bgImg.height = h;

        // add space shuttle
        shuttle = game.add.sprite(0, 0, "shuttle");
        shuttle.width *= objScale;
        shuttle.height *= objScale;
        shuttle.x = shuttle.width * 0.4 + margin*objScale;
        shuttle.y = (h-shuttle.height) / 2;
        shuttle.anchor.set(0.4, 0.55);
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
            if (gamePaused) {
                resumeGame();
            }
        } else {
            pauseGame();
            return;
        }

        if (gameStart) {

            var mid = gs.getBipolarMidpoint();

            // shuttle movements
            shuttle.rotation = mid.angle;

            // start creating enemies
            if (first) {
                game.time.events.add(Phaser.Timer.SECOND * 5, createEnemy, this);
                game.time.events.add(Phaser.Timer.SECOND * 1, createRay, this);
                first = false;
            }

            // check collision
            for (var i = 0; i < enemies.length; i++) {
                for (var j = 0; j < rays.length; j++) {
                    game.physics.arcade.collide(enemies[i], rays[j], function() {
                        onDestroyEnemy(i, j);
                    });
                }
                game.physics.arcade.overlap(enemies[i], shuttle, onShuttleCrashed);
            }

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
    }

    function resumeGame() {
        connectTxt.visible = false;
    }

    function pauseGame() {
        gamePaused = true;
        connectTxt.visible = true;
        game.world.bringToTop(connectTxt);
    }

    function resetGame() {
        for (var i = 0; i < explosions.length; i++) {
            explosions[i].destroy();
        }
        gameStart = true;
        first = true;
        gameOver = false;
        startTxt.visible = false;
        ggTxt.visible = false;
    }

    function createEnemy() {
        console.log("creating enemy!");

        var enemy = game.add.sprite(w, -h*0.3 + Math.random()*h*1.6, "enemy");
        enemy.width *= objScale;
        enemy.height *= objScale;
        enemy.rotation = Math.atan((enemy.y - shuttle.y) / (enemy.x - shuttle.x));
        game.physics.arcade.enable(enemy);
        game.physics.arcade.velocityFromAngle(enemy.rotation * 180/Math.PI, -400 * objScale, enemy.body.velocity);
        enemies.push(enemy);

        if (gameStart) {
            game.time.events.add(Phaser.Timer.SECOND * (Math.random()*2+1), createEnemy, this);
        }
    }

    function createRay() {
        var posX = shuttle.x + shuttle.width * (0.6-0.2) * Math.cos(shuttle.rotation);
        var posY = shuttle.y + shuttle.width * (0.6-0.2) * Math.sin(shuttle.rotation);
        var ray = game.add.sprite(posX, posY, "ray");
        ray.width *= objScale;
        ray.height *= objScale;
        ray.rotation = shuttle.rotation;
        game.physics.arcade.enable(ray);
        game.physics.arcade.velocityFromAngle(ray.rotation * 180/Math.PI, 800 * objScale, ray.body.velocity);
        rays.push(ray);

        if (gameStart) {
            game.time.events.add(Phaser.Timer.HALF, createRay, this);
        }
    }

    function onShuttleCrashed() {
        console.log("shuttle crashed!");

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

    function onDestroyEnemy(enemyIdx, rayIdx) {
        var enemy = enemies[enemyIdx];
        var ray = rays[rayIdx];

        enemies.splice(enemyIdx, 1);
        rays.splice(rayIdx, 1);

        var midX = enemy.x + enemy.width / 2;
        var midY = enemy.y + enemy.height / 2;
        var posX = midX + (Math.random()-0.8) * enemy.width * 1.2;
        var posY = midY + (Math.random()-0.8) * enemy.height * 1.2;
        var explosion = game.add.sprite(posX, posY, "explosion", 0);
        explosion.width *= 0.8;
        explosion.height *= 0.8;
        explosion.animations.add("exp" + Math.round(enemy.x), expIdx[0], 20, false);
        explosion.play("exp" + Math.round(enemy.x), null, false, true);

        enemy.destroy();
        ray.destroy();
    }

})();
