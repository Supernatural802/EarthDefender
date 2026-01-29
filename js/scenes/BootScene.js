// Boot Scene - Loads all assets for V2 Tap Defense
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.createLoadingBar();

        // Player defense platform
        this.load.spritesheet('player-platform', 'assets/player-platform.png', {
            frameWidth: 64,
            frameHeight: 48
        });

        // Player laser
        this.load.image('player-laser', 'assets/player-laser.png');

        // Enemy laser
        this.load.image('enemy-laser', 'assets/enemy-laser.png');

        // Enemy Variant A (Easy - Green)
        this.load.spritesheet('enemy-a', 'assets/enemy-a.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Enemy Variant B (Medium - Yellow)
        this.load.spritesheet('enemy-b', 'assets/enemy-b.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Enemy Variant C (Hard - Red)
        this.load.spritesheet('enemy-c', 'assets/enemy-c.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Special Enemy (Power Core Carrier - Purple)
        this.load.spritesheet('enemy-special', 'assets/enemy-special.png', {
            frameWidth: 40,
            frameHeight: 40
        });

        // Power Core
        this.load.spritesheet('power-core', 'assets/power-core.png', {
            frameWidth: 24,
            frameHeight: 24
        });

        // Power-ups
        this.load.image('powerup-multishot', 'assets/powerup-multishot.png');
        this.load.image('powerup-health', 'assets/powerup-health.png');
        this.load.image('powerup-instakill', 'assets/powerup-instakill.png');

        // Earth
        this.load.spritesheet('earth', 'assets/earth.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Mothership
        this.load.spritesheet('mothership', 'assets/mothership.png', {
            frameWidth: 128,
            frameHeight: 64
        });
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title - portrait optimized
        this.add.text(width / 2, height / 2 - 100, 'SAVE THE\nEARTH', {
            font: 'bold 32px Arial',
            fill: '#00ff88',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 40, 'TAP DEFENSE', {
            font: '16px Arial',
            fill: '#aa44ff'
        }).setOrigin(0.5);

        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 + 10, 'Loading...', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Progress bar - narrower for portrait
        const barWidth = Math.min(300, width - 60);
        const progressBarBg = this.add.rectangle(width / 2, height / 2 + 50, barWidth, 22, 0x444444);
        const progressBar = this.add.rectangle(width / 2 - barWidth/2 + 5, height / 2 + 50, 0, 16, 0x00ff88);
        progressBar.setOrigin(0, 0.5);

        this.load.on('progress', (value) => {
            progressBar.width = (barWidth - 10) * value;
        });

        this.load.on('complete', () => {
            loadingText.setText('Ready!');
        });
    }

    create() {
        this.createAnimations();
        this.scene.start('TitleScene');
    }

    createAnimations() {
        // Player platform idle
        this.anims.create({
            key: 'platform-idle',
            frames: this.anims.generateFrameNumbers('player-platform', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });

        // Enemy Variant A
        this.anims.create({
            key: 'enemy-a-idle',
            frames: this.anims.generateFrameNumbers('enemy-a', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Enemy Variant B
        this.anims.create({
            key: 'enemy-b-idle',
            frames: this.anims.generateFrameNumbers('enemy-b', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Enemy Variant C
        this.anims.create({
            key: 'enemy-c-idle',
            frames: this.anims.generateFrameNumbers('enemy-c', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Special Enemy
        this.anims.create({
            key: 'enemy-special-idle',
            frames: this.anims.generateFrameNumbers('enemy-special', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        // Power Core
        this.anims.create({
            key: 'power-core-spin',
            frames: this.anims.generateFrameNumbers('power-core', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        // Earth rotation
        this.anims.create({
            key: 'earth-rotate',
            frames: this.anims.generateFrameNumbers('earth', { start: 0, end: 7 }),
            frameRate: 2,
            repeat: -1
        });

        // Mothership idle
        this.anims.create({
            key: 'mothership-idle',
            frames: this.anims.generateFrameNumbers('mothership', { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1
        });
    }
}
