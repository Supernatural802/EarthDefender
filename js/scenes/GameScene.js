// Main Game Scene - Space Shooter V2: Tap Defense
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Player (stationary defense platform)
        this.player = null;
        
        // Groups
        this.enemies = null;
        this.playerLasers = null;
        this.enemyLasers = null;
        this.powerCores = null;
        this.powerUps = null;
        
        // Earth
        this.earth = null;
        this.earthHealth = 100;
        this.earthMaxHealth = 100;
        
        // Mothership
        this.mothership = null;
        this.mothershipHealth = 100;
        this.mothershipMaxHealth = 100;
        
        // Mega Blast
        this.megaBlastGauge = 0;
        this.megaBlastMax = 100;
        this.megaBlastChargePerCore = 25;
        this.megaBlastDamage = 25;
        this.megaBlastReady = false;
        
        // Enemy configurations
        this.enemyConfigs = {
            variantA: { // Easy - Green
                health: 1,
                damage: 1,
                speed: 60,
                fireRate: 1500, // Fastest fire rate
                points: 10,
                color: 0x44ff44
            },
            variantB: { // Medium - Yellow
                health: 3,
                damage: 5,
                speed: 45,
                fireRate: 2500, // Medium fire rate
                points: 25,
                color: 0xffff44
            },
            variantC: { // Hard - Red
                health: 6,
                damage: 10,
                speed: 35,
                fireRate: 4000, // Slowest fire rate
                points: 50,
                color: 0xff4444
            },
            special: { // Power Core Carrier - Purple
                health: 10,
                damage: 0,
                speed: 30,
                fireRate: 0, // Doesn't fire
                points: 100,
                color: 0xaa44ff
            }
        };
        
        // Max enemies on screen
        this.maxEnemies = 10;
        
        // Spawn timing
        this.spawnTimer = null;
        this.specialSpawnCounter = 0;
        this.enemiesPerSpecial = 8; // Special spawns every X enemies
        
        // Power-up system
        this.enemiesDestroyed = 0;
        this.enemiesForPowerUp = 15;
        this.instaKillsRemaining = 0;
        this.multiShotActive = false;
        this.multiShotTimer = null;
        
        // Game state
        this.score = 0;
        this.gameOver = false;
        this.gameWon = false;
        
        // Currently shielded enemy
        this.shieldedEnemy = null;
    }

    create() {
        // Create starfield background
        this.createStarfield();

        // Create Earth at bottom
        this.createEarth();

        // Create Mothership at top
        this.createMothership();

        // Create groups
        this.playerLasers = this.physics.add.group();
        this.enemyLasers = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.powerCores = this.physics.add.group();
        this.powerUps = this.physics.add.group();

        // Create the player defense platform (stationary, above Earth)
        this.player = this.physics.add.sprite(400, 440, 'player-platform');
        this.player.setScale(1.2);
        this.player.play('platform-idle');
        this.player.setDepth(10);
        this.player.setImmovable(true);
        this.player.body.setSize(60, 40);

        // Setup collisions
        this.physics.add.overlap(this.playerLasers, this.enemies, this.laserHitEnemy, null, this);
        this.physics.add.overlap(this.enemyLasers, this.earth, this.enemyLaserHitEarth, null, this);
        this.physics.add.overlap(this.powerCores, this.player, this.collectPowerCore, null, this);
        this.physics.add.overlap(this.powerUps, this.player, this.collectPowerUp, null, this);
        
        // Enemy collision to prevent overlap
        this.physics.add.collider(this.enemies, this.enemies);

        // Setup tap/click input
        this.input.on('pointerdown', this.handleTap, this);

        // Resume audio context on first interaction
        this.input.on('pointerdown', () => {
            if (soundManager) soundManager.resume();
        }, this);

        // Start spawning enemies
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Create UI
        this.createUI();
    }

    createStarfield() {
        this.stars = [];
        
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
            
            const star = this.add.circle(x, y, size, 0xffffff, alpha);
            star.speed = size * 30;
            this.stars.push(star);
        }
    }

    createEarth() {
        // Earth sprite - large, fills bottom of screen
        this.earth = this.physics.add.sprite(400, 560, 'earth');
        this.earth.setScale(2.5); // Much larger
        this.earth.play('earth-rotate');
        this.earth.setDepth(5);
        
        // Set physics body to cover the scaled sprite area
        // Original sprite is 64x64, scaled 2.5x = 160x160
        // We want a wide rectangular hitbox at the top of the earth
        this.earth.body.setSize(140, 40);
        this.earth.body.setOffset(-38, 0); // Center the body
        this.earth.setImmovable(true);

        // Earth health bar background
        this.earthHealthBarBg = this.add.rectangle(400, 480, 200, 14, 0x333333);
        this.earthHealthBarBg.setStrokeStyle(2, 0x4488ff);
        this.earthHealthBarBg.setDepth(6);

        // Earth health bar fill
        this.earthHealthBar = this.add.rectangle(301, 480, 196, 10, 0x00ff00);
        this.earthHealthBar.setOrigin(0, 0.5);
        this.earthHealthBar.setDepth(6);
    }

    createMothership() {
        this.mothership = this.physics.add.sprite(400, 50, 'mothership');
        this.mothership.setScale(1);
        this.mothership.play('mothership-idle');
        this.mothership.setDepth(5);
        this.mothership.setImmovable(true);

        // Mothership movement
        this.tweens.add({
            targets: this.mothership,
            x: { from: 150, to: 650 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Health bar background
        this.mothershipHealthBarBg = this.add.rectangle(400, 90, 160, 14, 0x333333);
        this.mothershipHealthBarBg.setStrokeStyle(2, 0xff4444);
        this.mothershipHealthBarBg.setDepth(6);

        // Health bar fill
        this.mothershipHealthBar = this.add.rectangle(321, 90, 156, 10, 0xff4444);
        this.mothershipHealthBar.setOrigin(0, 0.5);
        this.mothershipHealthBar.setDepth(6);

        // Boss label
        this.add.text(400, 105, 'MOTHERSHIP', {
            font: 'bold 11px Arial',
            fill: '#ff6666'
        }).setOrigin(0.5).setDepth(6);
    }

    createUI() {
        // Score
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            font: 'bold 20px Arial',
            fill: '#00ff88'
        });

        // Earth label
        this.add.text(400, 465, 'EARTH', {
            font: 'bold 12px Arial',
            fill: '#4488ff'
        }).setOrigin(0.5);

        // Mega Blast label
        this.add.text(16, 50, 'MEGA BLAST:', {
            font: 'bold 12px Arial',
            fill: '#aa44ff'
        });

        // Mega Blast gauge background (below the label)
        this.add.rectangle(90, 87, 150, 22, 0x333333).setStrokeStyle(2, 0xaa44ff);

        // Mega Blast gauge fill
        this.megaBlastBar = this.add.rectangle(16, 87, 0, 16, 0xaa44ff);
        this.megaBlastBar.setOrigin(0, 0.5);

        // Mega Blast percentage
        this.megaBlastText = this.add.text(90, 87, '0%', {
            font: 'bold 12px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Ready indicator
        this.megaBlastReadyText = this.add.text(90, 110, 'TAP MOTHERSHIP!', {
            font: 'bold 12px Arial',
            fill: '#ffff00'
        }).setOrigin(0.5).setVisible(false);

        // Instructions
        this.add.text(400, 16, 'TAP enemies to destroy | TAP Mothership when charged', {
            font: '11px Arial',
            fill: '#666666'
        }).setOrigin(0.5);

        // Power-up indicator (hidden initially)
        this.powerUpText = this.add.text(780, 50, '', {
            font: 'bold 14px Arial',
            fill: '#ffff00'
        }).setOrigin(1, 0.5).setVisible(false);

        // Insta-kill counter
        this.instaKillText = this.add.text(780, 75, '', {
            font: 'bold 12px Arial',
            fill: '#ff8800'
        }).setOrigin(1, 0.5).setVisible(false);
    }

    handleTap(pointer) {
        if (this.gameOver || this.gameWon) return;

        // Check if mega blast is ready and tapped on mothership (larger tap area for mobile)
        if (this.megaBlastReady) {
            const distToMothership = Phaser.Math.Distance.Between(
                pointer.x, pointer.y, 
                this.mothership.x, this.mothership.y
            );
            if (distToMothership < 100) {
                this.fireMegaBlast();
                return;
            }
        }

        // Check if tap hit an enemy
        const tappedEnemy = this.getTappedEnemy(pointer.x, pointer.y);
        
        if (tappedEnemy) {
            this.fireAtEnemy(tappedEnemy);
        }
    }

    getTappedEnemy(x, y) {
        let closestEnemy = null;
        // Larger tap tolerance for mobile (50px instead of 40px)
        let closestDistance = 50;

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            
            const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        return closestEnemy;
    }

    fireAtEnemy(targetEnemy) {
        // Create laser from player to enemy
        const laser = this.playerLasers.create(this.player.x, this.player.y - 20, 'player-laser');
        if (!laser) return;

        laser.setDepth(15);
        laser.targetEnemy = targetEnemy;

        // Calculate angle and velocity toward enemy
        const angle = Phaser.Math.Angle.Between(laser.x, laser.y, targetEnemy.x, targetEnemy.y);
        const speed = 800;
        
        laser.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        laser.setRotation(angle + Math.PI / 2);

        // Multi-shot power-up: fire at nearby enemies too
        if (this.multiShotActive) {
            this.fireMultiShot(targetEnemy);
        }

        // Visual feedback on player
        this.player.setTint(0x88ffff);
        this.time.delayedCall(50, () => {
            if (this.player) this.player.clearTint();
        });

        // Sound effect
        if (soundManager) soundManager.playerLaser();
    }

    fireMultiShot(primaryTarget) {
        // Find 2 other nearby enemies
        const otherEnemies = this.enemies.getChildren()
            .filter(e => e.active && e !== primaryTarget)
            .sort((a, b) => {
                const distA = Phaser.Math.Distance.Between(primaryTarget.x, primaryTarget.y, a.x, a.y);
                const distB = Phaser.Math.Distance.Between(primaryTarget.x, primaryTarget.y, b.x, b.y);
                return distA - distB;
            })
            .slice(0, 2);

        otherEnemies.forEach(enemy => {
            const laser = this.playerLasers.create(this.player.x, this.player.y - 20, 'player-laser');
            if (!laser) return;

            laser.setDepth(15);
            laser.setTint(0x88ff88); // Green tint for multi-shot

            const angle = Phaser.Math.Angle.Between(laser.x, laser.y, enemy.x, enemy.y);
            const speed = 800;
            
            laser.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            laser.setRotation(angle + Math.PI / 2);
        });
    }

    spawnEnemy() {
        if (this.gameOver || this.gameWon) return;

        // Limit max enemies on screen
        if (this.enemies.getChildren().length >= this.maxEnemies) {
            return;
        }

        this.specialSpawnCounter++;

        // Determine enemy type
        let enemyType;
        if (this.specialSpawnCounter >= this.enemiesPerSpecial) {
            enemyType = 'special';
            this.specialSpawnCounter = 0;
        } else {
            // Weighted random for variants
            const roll = Math.random();
            if (roll < 0.5) {
                enemyType = 'variantA'; // 50% easy
            } else if (roll < 0.8) {
                enemyType = 'variantB'; // 30% medium
            } else {
                enemyType = 'variantC'; // 20% hard
            }
        }

        const config = this.enemyConfigs[enemyType];
        
        // Find a non-overlapping spawn position
        let x = this.findNonOverlappingX();
        
        // Create enemy
        const spriteKey = enemyType === 'special' ? 'enemy-special' : `enemy-${enemyType.slice(-1).toLowerCase()}`;
        const enemy = this.enemies.create(x, 120, spriteKey);
        
        if (!enemy) return;

        enemy.enemyType = enemyType;
        enemy.health = config.health;
        enemy.maxHealth = config.health;
        enemy.damage = config.damage;
        enemy.points = config.points;
        enemy.fireRate = config.fireRate;
        enemy.lastFired = 0;
        enemy.isShielded = false;
        enemy.setDepth(8);

        // Play animation
        enemy.play(`${spriteKey}-idle`);

        // Enemy starts moving down until it reaches its target Y position
        enemy.targetY = Phaser.Math.Between(180, 300); // Stop in upper half
        enemy.setVelocityY(config.speed);
        enemy.hasReachedPosition = false;
        enemy.hasActiveLaser = false; // Track if laser is in flight

        // If special enemy, shield a random existing enemy
        if (enemyType === 'special') {
            this.applyShield(enemy);
        }

        // Create health bar for enemies with more than 1 health
        if (config.health > 1) {
            this.createEnemyHealthBar(enemy);
        }
    }

    findNonOverlappingX() {
        const minSpacing = 60; // Minimum space between enemies
        const attempts = 20;
        
        for (let i = 0; i < attempts; i++) {
            const testX = Phaser.Math.Between(80, 720);
            let overlapping = false;
            
            this.enemies.getChildren().forEach(enemy => {
                if (Math.abs(enemy.x - testX) < minSpacing && enemy.y < 200) {
                    overlapping = true;
                }
            });
            
            if (!overlapping) {
                return testX;
            }
        }
        
        // If no spot found after attempts, return random position
        return Phaser.Math.Between(80, 720);
    }

    createEnemyHealthBar(enemy) {
        const barWidth = 30;
        const barHeight = 4;
        
        enemy.healthBarBg = this.add.rectangle(enemy.x, enemy.y - 25, barWidth, barHeight, 0x333333);
        enemy.healthBarBg.setDepth(9);
        
        enemy.healthBar = this.add.rectangle(enemy.x - barWidth/2 + 1, enemy.y - 25, barWidth - 2, barHeight - 2, 0x00ff00);
        enemy.healthBar.setOrigin(0, 0.5);
        enemy.healthBar.setDepth(9);
    }

    applyShield(specialEnemy) {
        // Find a random non-special enemy to shield
        const targetableEnemies = this.enemies.getChildren().filter(e => 
            e.active && e !== specialEnemy && e.enemyType !== 'special' && !e.isShielded
        );

        if (targetableEnemies.length > 0) {
            const target = Phaser.Utils.Array.GetRandom(targetableEnemies);
            target.isShielded = true;
            target.shieldHealth = this.enemyConfigs.special.health; // Shield has same health as special enemy (10)
            target.shieldMaxHealth = target.shieldHealth;
            target.shieldSource = specialEnemy; // Track which special enemy created this shield
            this.shieldedEnemy = target;
            specialEnemy.shieldTarget = target;

            // Visual shield effect
            target.shieldGraphic = this.add.circle(target.x, target.y, 25, 0xaa44ff, 0.3);
            target.shieldGraphic.setStrokeStyle(2, 0xdd88ff);
            target.shieldGraphic.setDepth(7);

            // Show shield line connecting them
            specialEnemy.shieldLine = this.add.graphics();
            specialEnemy.shieldLine.setDepth(6);
        }
    }

    removeShield(specialEnemy) {
        if (specialEnemy.shieldTarget) {
            const target = specialEnemy.shieldTarget;
            target.isShielded = false;
            target.shieldSource = null;
            
            if (target.shieldGraphic) {
                target.shieldGraphic.destroy();
                target.shieldGraphic = null;
            }

            if (this.shieldedEnemy === target) {
                this.shieldedEnemy = null;
            }
        }

        if (specialEnemy.shieldLine) {
            specialEnemy.shieldLine.destroy();
            specialEnemy.shieldLine = null;
        }
    }

    breakShield(shieldedEnemy) {
        // Sound effect
        if (soundManager) soundManager.shieldBreak();

        // Get the special enemy that created this shield
        const specialEnemy = shieldedEnemy.shieldSource;
        
        // Create shield break effect
        this.createShieldBreakEffect(shieldedEnemy.x, shieldedEnemy.y);
        
        // Remove shield from the enemy
        shieldedEnemy.isShielded = false;
        if (shieldedEnemy.shieldGraphic) {
            shieldedEnemy.shieldGraphic.destroy();
            shieldedEnemy.shieldGraphic = null;
        }
        if (this.shieldedEnemy === shieldedEnemy) {
            this.shieldedEnemy = null;
        }
        
        // If the special enemy still exists, destroy it and drop power core
        if (specialEnemy && specialEnemy.active) {
            // Clean up shield line
            if (specialEnemy.shieldLine) {
                specialEnemy.shieldLine.destroy();
                specialEnemy.shieldLine = null;
            }
            
            // Spawn power core at special enemy location
            this.spawnPowerCore(specialEnemy.x, specialEnemy.y);
            
            // Create explosion at special enemy
            this.createExplosion(specialEnemy.x, specialEnemy.y, 'special');
            
            // Add score for destroying special enemy
            this.score += this.enemyConfigs.special.points;
            this.scoreText.setText('SCORE: ' + this.score);
            
            // Clean up special enemy
            if (specialEnemy.floatTween) specialEnemy.floatTween.stop();
            if (specialEnemy.healthBar) specialEnemy.healthBar.destroy();
            if (specialEnemy.healthBarBg) specialEnemy.healthBarBg.destroy();
            
            specialEnemy.destroy();
        }
        
        // Show "SHIELD BROKEN!" text
        const text = this.add.text(shieldedEnemy.x, shieldedEnemy.y - 40, 'SHIELD BROKEN!', {
            font: 'bold 14px Arial',
            fill: '#ff88ff'
        }).setOrigin(0.5).setDepth(21);

        this.tweens.add({
            targets: text,
            y: shieldedEnemy.y - 80,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    createShieldBreakEffect(x, y) {
        // Purple shards flying outward
        const colors = [0xaa44ff, 0xdd88ff, 0xff88ff, 0xffffff];
        
        for (let i = 0; i < 20; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            // Create shard-like rectangles
            const shard = this.add.rectangle(x, y, Phaser.Math.Between(4, 10), Phaser.Math.Between(2, 4), color);
            shard.setDepth(25);
            shard.setRotation(Math.random() * Math.PI * 2);
            
            const angle = (i / 20) * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 200);
            
            this.tweens.add({
                targets: shard,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                rotation: shard.rotation + Phaser.Math.Between(-2, 2),
                duration: 400,
                ease: 'Power2',
                onComplete: () => shard.destroy()
            });
        }
        
        // Add a ripple effect
        const ripple = this.add.circle(x, y, 20, 0xaa44ff, 0.8);
        ripple.setDepth(24);
        
        this.tweens.add({
            targets: ripple,
            radius: 60,
            alpha: 0,
            duration: 300,
            onComplete: () => ripple.destroy()
        });
    }

    laserHitEnemy(laser, enemy) {
        if (!enemy.active) return;

        // Check if enemy is shielded
        if (enemy.isShielded) {
            // Sound effect
            if (soundManager) soundManager.shieldHit();

            // Damage the shield instead of the enemy
            enemy.shieldHealth--;
            
            // Show shield hit effect
            this.createShieldHitEffect(enemy.x, enemy.y);
            
            // Flash the shield and change its appearance based on remaining health
            if (enemy.shieldGraphic) {
                const shieldPercent = enemy.shieldHealth / enemy.shieldMaxHealth;
                enemy.shieldGraphic.setFillStyle(0xffffff, 0.6);
                this.time.delayedCall(50, () => {
                    if (enemy.shieldGraphic) {
                        // Shield gets more transparent as it takes damage
                        const alpha = 0.2 + (shieldPercent * 0.3);
                        enemy.shieldGraphic.setFillStyle(0xaa44ff, alpha);
                        // Shield stroke gets thinner as it weakens
                        enemy.shieldGraphic.setStrokeStyle(1 + shieldPercent, 0xdd88ff);
                    }
                });
            }
            
            // Check if shield is broken
            if (enemy.shieldHealth <= 0) {
                this.breakShield(enemy);
            }
            
            laser.destroy();
            return;
        }

        // Destroy laser
        laser.destroy();

        // Insta-kill power-up check
        if (this.instaKillsRemaining > 0 && enemy.health > 1) {
            this.instaKillsRemaining--;
            this.updateInstaKillUI();
            enemy.health = 0;
        } else {
            // Deal damage
            enemy.health--;
        }

        // Update health bar
        if (enemy.healthBar) {
            const percent = enemy.health / enemy.maxHealth;
            enemy.healthBar.width = 28 * percent;
            
            if (percent <= 0.3) {
                enemy.healthBar.setFillStyle(0xff0000);
            } else if (percent <= 0.6) {
                enemy.healthBar.setFillStyle(0xffff00);
            }
        }

        // Flash enemy
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Check if destroyed
        if (enemy.health <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    createShieldHitEffect(x, y, shieldHealth, shieldMaxHealth) {
        // Purple ripple effect
        const ripple = this.add.circle(x, y, 10, 0xaa44ff, 0.8);
        ripple.setDepth(20);

        this.tweens.add({
            targets: ripple,
            radius: 40,
            alpha: 0,
            duration: 200,
            onComplete: () => ripple.destroy()
        });

        // Show shield damage text with remaining hits
        const text = this.add.text(x, y - 30, `SHIELD HIT!`, {
            font: 'bold 12px Arial',
            fill: '#dd88ff'
        }).setOrigin(0.5).setDepth(21);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 500,
            onComplete: () => text.destroy()
        });
    }

    destroyEnemy(enemy) {
        // Remove shield if this was a special enemy
        if (enemy.enemyType === 'special') {
            this.removeShield(enemy);
            this.spawnPowerCore(enemy.x, enemy.y);
        }

        // Remove from shielded if it was shielded
        if (enemy === this.shieldedEnemy) {
            this.shieldedEnemy = null;
        }

        // Clean up float tween
        if (enemy.floatTween) enemy.floatTween.stop();

        // Clean up health bars
        if (enemy.healthBar) enemy.healthBar.destroy();
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        if (enemy.shieldGraphic) enemy.shieldGraphic.destroy();

        // Create explosion
        this.createExplosion(enemy.x, enemy.y, enemy.enemyType);

        // Sound effect
        if (soundManager) soundManager.explosion();

        // Add score
        this.score += enemy.points;
        this.scoreText.setText('SCORE: ' + this.score);

        // Track enemies destroyed for power-ups
        this.enemiesDestroyed++;
        if (this.enemiesDestroyed >= this.enemiesForPowerUp) {
            this.enemiesDestroyed = 0;
            this.spawnPowerUp();
        }

        // Destroy enemy
        enemy.destroy();
    }

    spawnPowerCore(x, y) {
        const core = this.powerCores.create(x, y, 'power-core');
        core.setDepth(12);
        core.play('power-core-spin');

        // Power core will be attracted to player - handled in update
        core.isBeingAbsorbed = false;

        // Pulse effect
        this.tweens.add({
            targets: core,
            scale: { from: 1, to: 1.3 },
            duration: 250,
            yoyo: true,
            repeat: -1
        });

        // Show indicator
        const text = this.add.text(x, y - 20, 'POWER CORE!', {
            font: 'bold 14px Arial',
            fill: '#aa44ff'
        }).setOrigin(0.5).setDepth(21);

        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });

        // After a short delay, start absorbing toward player
        this.time.delayedCall(500, () => {
            if (core.active) {
                core.isBeingAbsorbed = true;
            }
        });
    }

    collectPowerCore(player, core) {
        // Sound effect
        if (soundManager) soundManager.powerCore();

        // Charge mega blast
        this.megaBlastGauge = Math.min(this.megaBlastGauge + this.megaBlastChargePerCore, this.megaBlastMax);
        this.updateMegaBlastUI();

        // Effect
        this.createCollectEffect(core.x, core.y, 0xaa44ff);

        // Show +25 text
        const text = this.add.text(core.x, core.y, '+25% CHARGE', {
            font: 'bold 16px Arial',
            fill: '#dd88ff'
        }).setOrigin(0.5).setDepth(21);

        this.tweens.add({
            targets: text,
            y: core.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        core.destroy();
    }

    spawnPowerUp() {
        const types = ['multishot', 'health', 'instakill'];
        const type = Phaser.Utils.Array.GetRandom(types);

        const x = Phaser.Math.Between(100, 700);
        const powerUp = this.powerUps.create(x, 100, `powerup-${type}`);
        powerUp.powerUpType = type;
        powerUp.setDepth(12);
        powerUp.isBeingAbsorbed = false;

        // Glow effect
        this.tweens.add({
            targets: powerUp,
            alpha: { from: 1, to: 0.6 },
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        // Start absorbing toward player after short delay
        this.time.delayedCall(300, () => {
            if (powerUp.active) {
                powerUp.isBeingAbsorbed = true;
            }
        });
    }

    collectPowerUp(player, powerUp) {
        // Sound effect
        if (soundManager) soundManager.powerUp();

        const type = powerUp.powerUpType;

        switch (type) {
            case 'multishot':
                this.activateMultiShot();
                break;
            case 'health':
                this.healEarth(30);
                break;
            case 'instakill':
                this.addInstaKill(3);
                break;
        }

        this.createCollectEffect(powerUp.x, powerUp.y, 0xffff00);
        powerUp.destroy();
    }

    activateMultiShot() {
        this.multiShotActive = true;
        this.powerUpText.setText('MULTI-SHOT: 5s');
        this.powerUpText.setVisible(true);

        // Cancel existing timer
        if (this.multiShotTimer) this.multiShotTimer.remove();

        // Countdown display
        let remaining = 5;
        this.multiShotCountdown = this.time.addEvent({
            delay: 1000,
            callback: () => {
                remaining--;
                if (remaining > 0) {
                    this.powerUpText.setText(`MULTI-SHOT: ${remaining}s`);
                }
            },
            repeat: 4
        });

        // Deactivate after 5 seconds
        this.multiShotTimer = this.time.delayedCall(5000, () => {
            this.multiShotActive = false;
            this.powerUpText.setVisible(false);
            if (this.multiShotCountdown) this.multiShotCountdown.remove();
        });
    }

    healEarth(amount) {
        this.earthHealth = Math.min(this.earthHealth + amount, this.earthMaxHealth);
        this.updateEarthHealthBar();

        // Flash earth green
        this.earth.setTint(0x00ff00);
        this.time.delayedCall(200, () => {
            if (this.earth) this.earth.clearTint();
        });

        // Show heal text
        const text = this.add.text(400, 480, `+${amount} EARTH HEALTH`, {
            font: 'bold 16px Arial',
            fill: '#00ff00'
        }).setOrigin(0.5).setDepth(21);

        this.tweens.add({
            targets: text,
            y: 430,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    addInstaKill(count) {
        this.instaKillsRemaining += count;
        this.updateInstaKillUI();
    }

    updateInstaKillUI() {
        if (this.instaKillsRemaining > 0) {
            this.instaKillText.setText(`INSTA-KILL: ${this.instaKillsRemaining}`);
            this.instaKillText.setVisible(true);
        } else {
            this.instaKillText.setVisible(false);
        }
    }

    createCollectEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 4, color);
            particle.setDepth(20);

            const angle = (i / 8) * Math.PI * 2;
            const dist = 50;

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    updateMegaBlastUI() {
        const percent = this.megaBlastGauge / this.megaBlastMax;
        this.megaBlastBar.width = 146 * percent;
        this.megaBlastText.setText(Math.floor(percent * 100) + '%');

        if (this.megaBlastGauge >= this.megaBlastMax && !this.megaBlastReady) {
            this.megaBlastReady = true;
            this.megaBlastReadyText.setVisible(true);

            this.tweens.add({
                targets: this.megaBlastReadyText,
                alpha: 0.3,
                duration: 300,
                yoyo: true,
                repeat: -1
            });

            // Flash player
            this.player.setTint(0xaa44ff);
            this.time.delayedCall(300, () => {
                if (this.player) this.player.clearTint();
            });

            // Add pulsing target indicator on mothership
            if (!this.mothershipTarget) {
                this.mothershipTarget = this.add.circle(this.mothership.x, this.mothership.y, 50, 0xaa44ff, 0);
                this.mothershipTarget.setStrokeStyle(3, 0xaa44ff);
                this.mothershipTarget.setDepth(4);
                
                this.mothershipTargetTween = this.tweens.add({
                    targets: this.mothershipTarget,
                    scale: { from: 0.8, to: 1.2 },
                    alpha: { from: 0.8, to: 0.3 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else if (this.megaBlastGauge < this.megaBlastMax) {
            this.megaBlastReady = false;
            this.megaBlastReadyText.setVisible(false);
            
            // Remove mothership target indicator
            if (this.mothershipTarget) {
                if (this.mothershipTargetTween) this.mothershipTargetTween.stop();
                this.mothershipTarget.destroy();
                this.mothershipTarget = null;
            }
        }
    }

    fireMegaBlast() {
        if (!this.megaBlastReady || this.gameOver || this.gameWon) return;

        this.megaBlastReady = false;
        this.megaBlastGauge = 0;
        this.updateMegaBlastUI();

        // Remove mothership target indicator
        if (this.mothershipTarget) {
            if (this.mothershipTargetTween) this.mothershipTargetTween.stop();
            this.mothershipTarget.destroy();
            this.mothershipTarget = null;
        }

        // Sound effect
        if (soundManager) soundManager.megaBlast();

        // Create massive beam
        const beam = this.add.rectangle(this.player.x, 300, 40, 500, 0xaa44ff);
        beam.setDepth(25);

        const glow = this.add.rectangle(this.player.x, 300, 80, 500, 0xdd88ff, 0.4);
        glow.setDepth(24);

        // Screen flash
        this.cameras.main.flash(300, 170, 68, 255);
        this.cameras.main.shake(300, 0.02);

        // Animate
        this.tweens.add({
            targets: [beam, glow],
            alpha: 0,
            scaleX: 2,
            duration: 600,
            onComplete: () => {
                beam.destroy();
                glow.destroy();
            }
        });

        // Damage mothership
        this.time.delayedCall(150, () => {
            this.damageMothership(this.megaBlastDamage);
        });
    }

    damageMothership(amount) {
        this.mothershipHealth -= amount;

        // Sound effect
        if (soundManager) soundManager.mothershipHit();

        // Flash
        this.mothership.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (this.mothership && this.mothership.active) {
                this.mothership.clearTint();
            }
        });

        // Update health bar
        const percent = Math.max(0, this.mothershipHealth / this.mothershipMaxHealth);
        this.mothershipHealthBar.width = 156 * percent;

        // Explosion effect
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 100, () => {
                this.createExplosion(
                    this.mothership.x + Phaser.Math.Between(-50, 50),
                    this.mothership.y + Phaser.Math.Between(-20, 20),
                    'special'
                );
            });
        }

        // Check win
        if (this.mothershipHealth <= 0) {
            this.triggerWin();
        }
    }

    enemyFire(enemy) {
        if (!enemy.active || enemy.enemyType === 'special') return;

        const laser = this.enemyLasers.create(enemy.x, enemy.y + 15, 'enemy-laser');
        if (!laser) return;

        // Reset laser state for reused objects from pool
        laser.hasHit = false;
        laser.setActive(true);
        laser.setVisible(true);
        
        // Set damage explicitly as number
        laser.damage = Number(enemy.damage) || 1;
        laser.sourceEnemy = enemy;
        laser.setDepth(7);

        console.log(`Enemy ${enemy.enemyType} fired laser with damage: ${laser.damage}`);

        // Aim at Earth (with slight random offset for variety)
        const targetX = this.earth.x + Phaser.Math.Between(-40, 40);
        const targetY = this.earth.y;
        const angle = Phaser.Math.Angle.Between(laser.x, laser.y, targetX, targetY);
        const speed = 280;
        
        laser.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        laser.setRotation(angle + Math.PI / 2);

        // Mark enemy as having an active laser
        enemy.hasActiveLaser = true;

        // Color based on enemy type
        if (enemy.enemyType === 'variantC') {
            laser.setTint(0xff4444);
        } else if (enemy.enemyType === 'variantB') {
            laser.setTint(0xffff44);
        }

        // Sound effect
        if (soundManager) soundManager.enemyLaser();
    }

    enemyLaserHitEarth(objectA, objectB) {
        // Determine which object is the laser (has damage property)
        let laser;
        if (objectA.damage !== undefined) {
            laser = objectA;
        } else if (objectB.damage !== undefined) {
            laser = objectB;
        } else {
            return; // Neither is a laser, shouldn't happen
        }

        // Prevent double-hit processing
        if (!laser.active || laser.hasHit) return;
        laser.hasHit = true;

        // Allow the source enemy to fire again
        if (laser.sourceEnemy && laser.sourceEnemy.active) {
            laser.sourceEnemy.hasActiveLaser = false;
        }

        // Get damage amount (default to 1 if undefined)
        const damageAmount = laser.damage || 1;
        
        // Damage earth
        this.earthHealth -= damageAmount;
        console.log(`Earth hit! Damage: ${damageAmount}, Health remaining: ${this.earthHealth}`);
        this.updateEarthHealthBar();

        // Sound effect
        if (soundManager) soundManager.earthHit();

        // Flash earth (use this.earth to be safe)
        this.earth.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (this.earth && this.earth.active && !this.gameOver) {
                this.earth.clearTint();
            }
        });

        // Impact effect at laser position
        this.createExplosion(laser.x, laser.y, 'variantA');

        // Destroy only the laser
        laser.setActive(false);
        laser.setVisible(false);
        laser.body.enable = false;

        // Check game over
        if (this.earthHealth <= 0) {
            this.triggerGameOver();
        }
    }

    updateEarthHealthBar() {
        const percent = Math.max(0, this.earthHealth / this.earthMaxHealth);
        this.earthHealthBar.width = 196 * percent;

        if (percent <= 0.25) {
            this.earthHealthBar.setFillStyle(0xff0000);
        } else if (percent <= 0.5) {
            this.earthHealthBar.setFillStyle(0xff6600);
        } else if (percent <= 0.75) {
            this.earthHealthBar.setFillStyle(0xffff00);
        } else {
            this.earthHealthBar.setFillStyle(0x00ff00);
        }
    }

    createExplosion(x, y, type) {
        const colors = type === 'special' 
            ? [0xaa44ff, 0xdd88ff, 0xff88ff, 0xffffff]
            : [0xff6600, 0xffaa00, 0xff4400, 0xffff00];

        for (let i = 0; i < 10; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const particle = this.add.circle(x, y, Phaser.Math.Between(3, 7), color);
            particle.setDepth(20);

            const angle = (i / 10) * Math.PI * 2;
            const speed = Phaser.Math.Between(60, 120);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    triggerGameOver() {
        if (this.gameOver) return; // Prevent multiple calls
        this.gameOver = true;

        console.log('GAME OVER - Earth destroyed!');

        // Sound effect
        if (soundManager) soundManager.earthExplosion();

        if (this.spawnTimer) this.spawnTimer.destroy();

        // Clear remaining enemy lasers
        this.enemyLasers.clear(true, true);

        // Massive Earth explosion effect - multiple waves
        const earthX = this.earth.x;
        const earthY = this.earth.y;

        // Wave 1: Initial explosions
        for (let i = 0; i < 15; i++) {
            this.time.delayedCall(i * 50, () => {
                this.createExplosion(
                    earthX + Phaser.Math.Between(-70, 70),
                    earthY + Phaser.Math.Between(-50, 30),
                    'variantC'
                );
            });
        }

        // Wave 2: Bigger explosions
        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(800 + i * 60, () => {
                this.createLargeExplosion(
                    earthX + Phaser.Math.Between(-90, 90),
                    earthY + Phaser.Math.Between(-60, 40)
                );
            });
        }

        // Wave 3: Final burst
        this.time.delayedCall(1600, () => {
            for (let i = 0; i < 30; i++) {
                this.createLargeExplosion(
                    earthX + Phaser.Math.Between(-100, 100),
                    earthY + Phaser.Math.Between(-70, 50)
                );
            }
        });

        this.cameras.main.shake(2000, 0.03);
        this.cameras.main.flash(500, 255, 100, 0);

        this.time.delayedCall(1800, () => {
            if (this.earth) this.earth.setVisible(false);
            if (this.earthHealthBarBg) this.earthHealthBarBg.setVisible(false);
            if (this.earthHealthBar) this.earthHealthBar.setVisible(false);
        });

        this.time.delayedCall(2500, () => {
            this.showGameOver();
        });
    }

    createLargeExplosion(x, y) {
        const colors = [0xff0000, 0xff6600, 0xffaa00, 0xffff00, 0xffffff];

        for (let i = 0; i < 15; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const particle = this.add.circle(x, y, Phaser.Math.Between(5, 15), color);
            particle.setDepth(100);

            const angle = (i / 15) * Math.PI * 2 + Math.random() * 0.5;
            const speed = Phaser.Math.Between(80, 180);

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    showGameOver() {
        // Sound effect
        if (soundManager) soundManager.gameOver();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
        overlay.setDepth(200);

        this.add.text(400, 180, 'GAME OVER', {
            font: 'bold 64px Arial',
            fill: '#ff4444'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 270, 'You did not save the Earth', {
            font: '28px Arial',
            fill: '#ff8888'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 340, 'Final Score: ' + this.score, {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 440, 'Tap or press SPACE to try again', {
            font: '18px Arial',
            fill: '#00ff88'
        }).setOrigin(0.5).setDepth(201);

        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.input.once('pointerdown', () => this.scene.restart());
        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    }

    triggerWin() {
        this.gameWon = true;

        // Sound effect
        if (soundManager) soundManager.mothershipExplosion();

        if (this.spawnTimer) this.spawnTimer.destroy();

        // Clear remaining enemies
        this.enemies.clear(true, true);
        this.enemyLasers.clear(true, true);

        // Mothership explosion
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 60, () => {
                if (this.mothership) {
                    this.createExplosion(
                        this.mothership.x + Phaser.Math.Between(-70, 70),
                        this.mothership.y + Phaser.Math.Between(-25, 25),
                        'special'
                    );
                }
            });
        }

        this.cameras.main.flash(500, 255, 255, 255);
        this.cameras.main.shake(1500, 0.02);

        this.time.delayedCall(1800, () => {
            this.mothership.setVisible(false);
            this.mothershipHealthBarBg.setVisible(false);
            this.mothershipHealthBar.setVisible(false);
        });

        this.time.delayedCall(2500, () => {
            this.showWinScreen();
        });
    }

    showWinScreen() {
        // Sound effect
        if (soundManager) soundManager.victory();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x001133, 0.9);
        overlay.setDepth(200);

        const winText = this.add.text(400, 180, 'You saved Earth!', {
            font: 'bold 56px Arial',
            fill: '#00ff88'
        }).setOrigin(0.5).setDepth(201);

        this.tweens.add({
            targets: winText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.add.text(400, 270, 'The Mothership has been destroyed!', {
            font: '22px Arial',
            fill: '#88ffaa'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 340, 'Final Score: ' + this.score, {
            font: '28px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 440, 'Tap or press SPACE to play again', {
            font: '18px Arial',
            fill: '#ffff00'
        }).setOrigin(0.5).setDepth(201);

        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Celebration particles
        this.time.addEvent({
            delay: 150,
            callback: () => {
                if (this.gameWon) {
                    const x = Phaser.Math.Between(100, 700);
                    const colors = [0x00ff88, 0xffff00, 0x00ffff, 0xaa44ff];

                    for (let i = 0; i < 4; i++) {
                        const color = Phaser.Utils.Array.GetRandom(colors);
                        const particle = this.add.circle(x, 600, Phaser.Math.Between(3, 6), color);
                        particle.setDepth(202);

                        this.tweens.add({
                            targets: particle,
                            y: Phaser.Math.Between(100, 400),
                            alpha: 0,
                            duration: 1200,
                            onComplete: () => particle.destroy()
                        });
                    }
                }
            },
            loop: true
        });

        this.input.once('pointerdown', () => this.scene.restart());
        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    }

    update(time) {
        if (this.gameOver || this.gameWon) return;

        // Update starfield
        this.updateStarfield();

        // Update enemies
        this.updateEnemies(time);

        // Update shield graphics
        this.updateShieldGraphics();

        // Update mothership target indicator position
        if (this.mothershipTarget && this.mothership) {
            this.mothershipTarget.x = this.mothership.x;
            this.mothershipTarget.y = this.mothership.y;
        }

        // Clean up off-screen objects
        this.cleanupObjects();
    }

    updateStarfield() {
        for (const star of this.stars) {
            star.y += star.speed * (1/60);
            if (star.y > 620) {
                star.y = -10;
                star.x = Phaser.Math.Between(0, 800);
            }
        }
    }

    updateEnemies(time) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            // Check if enemy has reached its target position
            if (!enemy.hasReachedPosition && enemy.y >= enemy.targetY) {
                enemy.hasReachedPosition = true;
                enemy.setVelocity(0, 0);
                
                // Start floating behavior - gentle bobbing motion
                enemy.floatTween = this.tweens.add({
                    targets: enemy,
                    x: enemy.x + Phaser.Math.Between(-20, 20),
                    y: enemy.y + Phaser.Math.Between(-10, 10),
                    duration: Phaser.Math.Between(1500, 2500),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // Update health bar position
            if (enemy.healthBar) {
                enemy.healthBar.x = enemy.x - 14;
                enemy.healthBar.y = enemy.y - 25;
                enemy.healthBarBg.x = enemy.x;
                enemy.healthBarBg.y = enemy.y - 25;
            }

            // Update shield graphic position
            if (enemy.shieldGraphic) {
                enemy.shieldGraphic.x = enemy.x;
                enemy.shieldGraphic.y = enemy.y;
            }

            // Enemy firing - only when in position and no active laser
            if (enemy.hasReachedPosition && enemy.fireRate > 0 && !enemy.hasActiveLaser) {
                if (time > enemy.lastFired + enemy.fireRate) {
                    this.enemyFire(enemy);
                    enemy.lastFired = time;
                }
            }

            // Destroy if somehow goes off screen (shouldn't happen now)
            if (enemy.y > 550) {
                if (enemy.floatTween) enemy.floatTween.stop();
                if (enemy.healthBar) enemy.healthBar.destroy();
                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                if (enemy.shieldGraphic) enemy.shieldGraphic.destroy();
                if (enemy.enemyType === 'special') {
                    this.removeShield(enemy);
                }
                enemy.destroy();
            }
        });
    }

    updateShieldGraphics() {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.enemyType === 'special' && enemy.shieldTarget && enemy.shieldLine) {
                const target = enemy.shieldTarget;
                if (target.active) {
                    enemy.shieldLine.clear();
                    enemy.shieldLine.lineStyle(2, 0xaa44ff, 0.5);
                    enemy.shieldLine.lineBetween(enemy.x, enemy.y, target.x, target.y);
                }
            }
        });
    }

    cleanupObjects() {
        // Clean up lasers
        this.playerLasers.getChildren().forEach(laser => {
            if (laser.y < -20 || laser.y > 620 || laser.x < -20 || laser.x > 820) {
                laser.destroy();
            }
        });

        this.enemyLasers.getChildren().forEach(laser => {
            if (laser.y > 620) {
                // Allow source enemy to fire again if laser goes off screen
                if (laser.sourceEnemy && laser.sourceEnemy.active) {
                    laser.sourceEnemy.hasActiveLaser = false;
                }
                laser.destroy();
            }
        });

        // Update and clean up power cores - absorb toward player
        this.powerCores.getChildren().forEach(core => {
            if (core.y > 620) {
                core.destroy();
                return;
            }

            // Move toward player when being absorbed
            if (core.isBeingAbsorbed && this.player) {
                const angle = Phaser.Math.Angle.Between(core.x, core.y, this.player.x, this.player.y);
                const speed = 300;
                core.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
            }
        });

        // Update and clean up power-ups - absorb toward player
        this.powerUps.getChildren().forEach(powerUp => {
            if (powerUp.y > 620) {
                powerUp.destroy();
                return;
            }

            // Move toward player when being absorbed
            if (powerUp.isBeingAbsorbed && this.player) {
                const angle = Phaser.Math.Angle.Between(powerUp.x, powerUp.y, this.player.x, this.player.y);
                const speed = 250;
                powerUp.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
            }
        });
    }
}
