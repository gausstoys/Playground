(function() {
    var w = 800;
    var h = 800;

    // Phaser objects
    var game = new Phaser.Game(w, h, Phaser.AUTO, "", { preload: preload, create: create, update: update, render: render }, true);
    var time = new Phaser.Time(game);

    // Images
    var background;
    var ground;
    var player;

    // Stairs
    var stairs = [];
    var stairColors = [];
    var stairAlpha = 0.3;

    stairColors.push(rgbToHex(240,90,40)); // red
    stairColors.push(rgbToHex(55,180,75)); // green
    stairColors.push(rgbToHex(0,175,240)); // blue
    stairColors.push(rgbToHex(255,200,0)); // yellow

    // Game state    
    var gameState = 0; 
    var currentLevel = 0;
    var scoreLevel = 0;
    var cameraSpeed = 1;
    var bestScore = 0;

    // keyboard
    var spaceKey,
        cursors;

    // Sound
    var score_sound,
        backboard,
        whoosh,
        fail,
        spawn;

    var gs,
        gsNotification,
        previousData;

    var divider;

    var forceReducer = 0.005;
    var crateGroup;
    var northPlanet;


    $('.restart-button').click(function(event){
        location.reload();
    });


    function preload() {
        game.load.image('bg', 'image/hockey.png');
        game.load.image('ground', 'image/ground8.png');
        game.load.image('stair', 'image/stair2.png');
        game.load.image('bomb', 'image/bomb40.png');
        game.load.image('crate', 'image/crate.png');

        // game.load.spritesheet('stair1', 'img/stair1.png', 200, 30, 2);
        // game.load.spritesheet('ship', 'img/humstar.png', 32, 32);
        game.load.spritesheet('dude', 'image/dude.png', 32, 48);


        // game.load.audio('score', 'audio/score.wav');
        // game.load.audio('backboard', 'audio/backboard.wav');
        // game.load.audio('whoosh', 'audio/whoosh.wav');
        // game.load.audio('fail', 'audio/fail.wav');
        // game.load.audio('spawn', 'audio/spawn.wav');
    }

    function create() {
        game.camera.bounds = null;

        // Enable Box2D physics
        game.physics.startSystem(Phaser.Physics.BOX2D);
        game.physics.box2d.debugDraw.centerOfMass = true;
        // game.physics.box2d.gravity.y = 500;
        game.physics.box2d.restitution = 0.3;
        game.physics.box2d.setBoundsToWorld();
        game.physics.box2d.restitution = 0.6;

        crateGroup = game.add.group();

        
        // Static platform 
        // ground = game.add.sprite(game.world.centerX, game.world.height-50, 'ground');
        // game.physics.box2d.enable(ground);
        // ground.body.static = true;


        // divider = new Phaser.Physics.Box2D.Body(game, null, game.world.centerX, game.world.height - 150, 2);
        // divider.setRectangle(10, 300, 0, 0, 0);
        // divider.static = true;

        northPlanet = new Phaser.Physics.Box2D.Body(game, null, game.world.centerX-100, 150, 2);
        northPlanet.setCircle(30);
        northPlanet.gravityRadius = 0;
        northPlanet.gravityForce = 400;
        northPlanet.static = true;
        northPlanet.sensor = true;

        for(var i = 0; i < 300; i++) {
            var crate = game.add.sprite(getRandomInt(10, game.world.width-10), getRandomInt(10, game.world.height-10), 'crate');
            var scaleRate = getRandomInt(3, 5) / 10;
            crate.scale.setTo(scaleRate, scaleRate);
            game.physics.box2d.enable(crate);
            crate.body.setCircle(10*scaleRate);

            crate.body.velocity.x = getRandomInt(-10, 10);
            crate.body.velocity.y = getRandomInt(-10, 10);

            crateGroup.add(crate);
        }
        // crate.body.setCircle(16);


        //Slowest square
        // var square1 = new Phaser.Physics.Box2D.Body(this.game, null, 50, 30, 2);
        // square1.setCircle(10);
        // // square1.setRectangle(20, 20, 0, 0, 0);
        // square1.friction = 0.4;
        
        // var square2 = new Phaser.Physics.Box2D.Body(this.game, null, 100, 30, 2);
        // square2.setCircle(10);
        // // square2.setRectangle(20, 20, 0, 0, 0);
        // square2.friction = 0.3;

        // //Average square
        // var square3 = new Phaser.Physics.Box2D.Body(this.game, null, 150, 30, 2);
        // square3.setCircle(10);
        // // square3.setRectangle(20, 20, 0, 0, 0);
        // square3.friction = 0.2;
        
        // var square4 = new Phaser.Physics.Box2D.Body(this.game, null, 200, 30, 2);
        // square4.setCircle(10);
        // // square4.setRectangle(20, 20, 0, 0, 0);
        // square4.friction = 0.1;

        // //Fastest square
        // var square5 = new Phaser.Physics.Box2D.Body(this.game, null, 250, 30, 2);
        // square5.setCircle(10);
        // // square5.setRectangle(20, 20, 0, 0, 0);
        // square5.friction = 0;


        // // Dynamic Stairs
        // for(var i=0; i<5; i++) {
        //     addStair();
        // }

        // // Player
        // player = game.add.sprite(game.world.centerX, game.world.height - 100, 'dude');
        // player.animations.add('left', [0, 1, 2, 3], 10, true);
        // player.animations.add('right', [5, 6, 7, 8], 10, true);
        // game.physics.box2d.enable(player);
        // player.body.fixedRotation = true;
        // player.body.setCategoryContactCallback(2, playerStairContactCallback, this);
        // player.body.setCategoryContactCallback(3, playerBombContactCallback, this);
        // // player.body.setCircle(16);

        // // Input
        // cursors = game.input.keyboard.createCursorKeys();
        // spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        // // Sounds
        // score_sound = game.add.audio('score');
        // backboard = game.add.audio('backboard');
        // backboard.volume = 0.5;
        // whoosh = game.add.audio('whoosh');
        // fail = game.add.audio('fail');
        // fail.volume = 0.1;
        // spawn = game.add.audio('spawn');

        // GaussSense
        gs = new GaussSense();
        // var gsDetectionInterval = setInterval(function(){
        //     checkGaussSense();
        // }, 2000);

    }

    function update() {

        for(var i=0; i<crateGroup.total; i++) {
            var c = crateGroup.getChildAt(i);
            
            // calculating distance between the planet and the crate
            var distance = Phaser.Math.distance(c.x,c.y,northPlanet.x,northPlanet.y);

            
            // checking if the distance is less than gravity radius
            if(distance<northPlanet.gravityRadius/2){
                // c.tint = rgbToHex(240,90,40);
                // calculating angle between the planet and the crate
                var angle = Phaser.Math.angleBetween(c.x,c.y,northPlanet.x,northPlanet.y);
                
                // add gravity force to the crate in the direction of planet center
                c.body.applyForce(northPlanet.gravityForce*Math.cos(angle)*forceReducer,northPlanet.gravityForce*Math.sin(angle)*forceReducer);
            }
        }

        if(gs.isConnected()) {
            var northPoint = gs.getNorthPoint();
            if(northPoint && northPoint.intensity > 1) {
                northPlanet.x = northPoint.x * game.world.width;
                northPlanet.y = northPoint.y * game.world.width;
                northPlanet.gravityRadius = 800 * northPoint.intensity/25;
                // console.log(northPlanet.intensity);
            }
            else {
                northPlanet.gravityRadius = 0;
            }
        }

        // if(gs.isConnected()) {
        //     processGaussSense();
        // }

        // // Move Camera
        // if(gameState === 1) {
        //     game.camera.y -= cameraSpeed;

        //     // if(scoreLevel === 5) {
        //     //     cameraSpeed = 0.6;
        //     // }
        //     // if(scoreLevel === 10) {
        //     //     cameraSpeed = 0.8;
        //     // }
        //     // if(scoreLevel === 15) {
        //     //     cameraSpeed = 1;
        //     // }
        //     // if(scoreLevel === 20) {
        //     //     cameraSpeed = 1.1;
        //     // }
        //     // if(scoreLevel === 25) {
        //     //     cameraSpeed = 1.2;
        //     // }
        //     // if(scoreLevel === 30) {
        //     //     cameraSpeed = 1.3;
        //     // }

        // }

        // // Control
        // if(cursors.up.isDown) {
        //     playerJump();
        // }

        // if(cursors.left.isDown) {
        //     player.body.velocity.x = -150;
        //     player.animations.play('left');
        // }

        // if(cursors.right.isDown) {
        //     player.body.velocity.x = 150;
        //     player.animations.play('right');
        // }


        // if(spaceKey.isDown) {
        //     if(gameState === 0) {
        //         gameState = 1;
        //     }
        // }


        // // Add Stairs
        // if(game.camera.y + 50 < stairs[stairs.length-1].y) {
        //     addStair();
        // }


        // // Detect player
        // if(player.y > game.camera.y + 800) {
        //     console.log('player outside');
        //     gameOver();
        //     // this.gameOverText.visible = true;
        // }
        // if(player.body.velocity.x === 0) {
        //     player.animations.stop();
        //     player.frame = 4;
        // }
    }

    function render() {
        // game.debug.box2dWorld();
        // game.debug.cameraInfo(game.camera, 32, 32);
    }

    function gameOver() {
        if(gameState === 1) {
            gameState = 2;

            $('#game-over-dialog').css('display', 'block');
            $('#game-over-dialog').addClass('slideInUp');

            fail.play();

            // Best Score
            bestScore = localStorage.getItem('otron-upstair-best-score');
            if(!bestScore) {
                localStorage.setItem('otron-upstair-best-score', scoreLevel);
                $('#best-score-text').html(scoreLevel);
            }
            else {
                if(scoreLevel > bestScore) {
                    localStorage.setItem('otron-upstair-best-score', scoreLevel);
                    $('#best-score-text').html(scoreLevel);
                }
                else {
                    $('#best-score-text').html(bestScore);
                }
            }
        }
    }

    function playerJump() {
        if(Math.abs(player.body.velocity.y) < 20) {
            player.body.velocity.y = -1000;
            player.animations.stop();
            player.frame = 4;
            spawn.play();


            if(gameState === 0) {
                $('#start-dialog').addClass('fadeOutDown');
                gameState = 1;
            }
        }
    }

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function addStair() {
        currentLevel += 1;
        var stairX, stairY;
        if(stairs.length === 0) {
            stairX = game.world.centerX + getRandomInt(-300, 300);
            stairY = game.world.height - (stairs.length + 1) * getRandomInt(80, 150) - 50;
        }
        else {
            stairX = stairs[stairs.length-1].x + getRandomInt(-300, 300);
            stairY = stairs[stairs.length-1].y - getRandomInt(100, 150);
        }

        if(stairX > 700) {
            stairX = 700;
        }
        if(stairX < 100) {
            stairX = 100;
        }


        // add first stair
        var colorIndex = getRandomInt(0, stairColors.length-1);
        var stair = game.add.sprite(stairX, stairY, 'stair');
        stair.tint = stairColors[colorIndex];
        stair.alpha = stairAlpha;
        stair.level = currentLevel;
        game.physics.box2d.enable(stair);
        stair.body.static = true;
        stair.body.sensor = true;
        stair.body.setCollisionCategory(2);
        stair.index = stairs.length;
        stairs.push(stair);

        if(getRandomInt(0, 5) == 0) {
            addBomb(stairX + getRandomInt(-50, 50), stairY-35, stair.index);
        }


        // add second stair
        if(stairX > game.world.centerX + 100 || stairX < game.world.centerX - 100) {
            colorIndex = getRandomInt(0, stairColors.length-1);
            var stair = game.add.sprite(game.world.centerX - (stairX - game.world.centerX), stairY, 'stair');
            stair.tint = stairColors[colorIndex];
            stair.alpha = stairAlpha;
            stair.level = currentLevel;
            game.physics.box2d.enable(stair);
            stair.body.static = true;
            stair.body.sensor = true;
            stair.body.setCollisionCategory(2);
            stair.index = stairs.length;
            stairs.push(stair);

            if(getRandomInt(0, 5) == 0) {
                addBomb(game.world.centerX - (stairX - game.world.centerX) + getRandomInt(-50, 50), stairY-35, stair.index);
            }
        }
    }

    function addBomb(x, y, id) {
        var bomb = game.add.sprite(x, y, 'bomb');
        bomb.alpha = 0.8;
        game.physics.box2d.enable(bomb);
        bomb.body.static = true;
        bomb.body.sensor = true;
        bomb.body.setCollisionCategory(3);
        bomb.index = id;
    }

    function playerStairContactCallback(body1, body2, fixture1, fixture2, begin) {
        if (!begin)
        {
            return;
        }

        if(body1.y < body2.y) {
            body2.sensor = false;
            body2.sprite.alpha = 1;
            backboard.play();

            if(body2.sprite.level > scoreLevel) {
                $('#current-score-text').html(body2.sprite.level);
                $('#score').html(body2.sprite.level);
                $('#score').addClass('bounceIn');

                $('#score').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
                     $('#score').removeClass('bounceIn');
                });
                scoreLevel = body2.sprite.level;
            }
        }
    }

    function playerBombContactCallback(body1, body2, fixture1, fixture2, begin) {
        if (!begin)
        {
            return;
        }

        var stairIndex = body2.sprite.index;
        var blinkAt = Date.now();
        var stairBlink = setInterval(function(){
            stairs[stairIndex].alpha = (stairs[stairIndex].alpha === 1) ? 0.5 : 1;

            if(Date.now() - blinkAt > 1000) {
                stairs[stairIndex].destroy();
                clearInterval(stairBlink);
            }
        }, 100);
        body2.sprite.destroy(); 
    }

    function scoreTextAnimate() {
    }

    function rgbToHex(r, g, b){  
        return r << 16 | g << 8 | b;
    }

    function checkGaussSense() {
        if(!gs.isConnected()) {
            openNotification('GaussSense is not detected.');
            // openInstructionPopup();
        }
        else {
            closeNotification();
            // closeInstructionPopup();
        }
    }

    function openNotification(text) {
        if(!gsNotification) {
            gsNotification = noty({
              layout: 'topRight',
              text: text,
              theme: 'relax', // or 'relax'
              type: '',
              closeWith: [],
              animation: {
                  open: 'animated flipInX', // Animate.css class names
                  close: 'animated flipOutX' // Animate.css class names
              }
            });
        }
    }

    function closeNotification() {
        if(gsNotification) {
            gsNotification.close();
            gsNotification = null;
        }
    }

    function openInstructionPopup() {
        if(!$.magnificPopup.instance.isOpen) {
            $.magnificPopup.open({
                items: {
                  src: '#how-to-play', // can be a HTML string, jQuery object, or CSS selector
                  type: 'inline'
                },
                closeOnBgClick: false,
                showCloseBtn: false
            });
        }
    }

    function closeInstructionPopup() {
        if($.magnificPopup.instance.isOpen) {
            $.magnificPopup.close();
        }
    }

    function processGaussSense() {
        var midPoint = gs.getBipolarMidpoint();

        if(midPoint) {
            var degrees = (midPoint.angle + Math.PI) * (180 / Math.PI);
            // console.log(degrees);
        }


        // if(previousData) {
        //     // console.log('pre: ' + previousData.intensity);
        //     // console.log('current: ' + midPoint.intensity);
        //     if(previousData.intensity > 10 && midPoint.intensity < 10) {
        //         console.log('jump');
        //         playerJump();
        //     }


        //     console.log(degrees);

        //     if(midPoint.intensity > 10) {
        //         if((degrees > 0 && degrees < 75) || (degrees > 315 && degrees < 360)) {
        //             player.body.velocity.x = 150;
        //             player.animations.play('right');
        //         }

        //         if(degrees > 105 && degrees < 225) {
        //             player.body.velocity.x = -150;
        //             player.animations.play('left');
        //         }
        //     }

        //     var diff = degrees - previousData.angle;

        //     if(Math.abs(diff) > 180) {
        //         if(diff > 0) {
        //             diff -= 360;
        //         }
        //         else {
        //             diff += 360;
        //         }
        //     }
        // }

        previousData = midPoint;
    }

})();
