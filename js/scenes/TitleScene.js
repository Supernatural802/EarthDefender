// Title Scene - Start screen with game instructions (Portrait Mode)
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Create animated starfield background
        this.createStarfield();

        // Game Title - portrait mode (400x700)
        const title = this.add.text(200, 60, 'SAVE THE\nEARTH', {
            font: 'bold 38px Arial',
            fill: '#00ff88',
            stroke: '#004422',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        // Pulsing title effect
        this.tweens.add({
            targets: title,
            scale: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(200, 120, 'TAP DEFENSE', {
            font: '18px Arial',
            fill: '#aa44ff'
        }).setOrigin(0.5);

        // Instructions Panel - portrait layout
        const panelY = 320;
        const panel = this.add.rectangle(200, panelY, 360, 280, 0x1a1a2e, 0.9);
        panel.setStrokeStyle(2, 0x4a4a6a);

        // How to Play Header
        this.add.text(200, panelY - 120, 'HOW TO PLAY', {
            font: 'bold 16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Instructions - adjusted for portrait
        const instructions = [
            { icon: '👆', text: 'TAP enemies to shoot them' },
            { icon: '🟢🟡🔴', text: 'Green=Easy Yellow=Med Red=Hard' },
            { icon: '🟣', text: 'Purple enemies drop Power Cores' },
            { icon: '⚡', text: 'Collect 4 cores for MEGA BLAST' },
            { icon: '🎯', text: 'TAP Mothership when charged' },
            { icon: '🛡️', text: 'Shoot shields to break them!' },
            { icon: '🏆', text: 'Destroy Mothership to WIN!' }
        ];

        instructions.forEach((inst, index) => {
            const y = panelY - 85 + (index * 30);
            
            this.add.text(35, y, inst.icon, {
                font: '14px Arial'
            }).setOrigin(0.5);

            this.add.text(55, y, inst.text, {
                font: '12px Arial',
                fill: '#cccccc'
            }).setOrigin(0, 0.5);
        });

        // Start Button (larger for mobile)
        const buttonY = 530;
        const button = this.add.rectangle(200, buttonY, 220, 60, 0x00aa66);
        button.setStrokeStyle(3, 0x00ff88);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(200, buttonY, 'START GAME', {
            font: 'bold 22px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Button hover effects
        button.on('pointerover', () => {
            button.setFillStyle(0x00cc77);
            button.setScale(1.05);
            buttonText.setScale(1.05);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x00aa66);
            button.setScale(1);
            buttonText.setScale(1);
        });

        // Button click - start game
        button.on('pointerdown', () => {
            // Resume audio
            if (soundManager) soundManager.resume();
            
            // Flash effect
            this.cameras.main.flash(200, 0, 255, 136);
            
            // Play a sound
            if (soundManager) soundManager.powerUp();

            // Start game after short delay
            this.time.delayedCall(200, () => {
                this.scene.start('GameScene');
            });
        });

        // Pulsing button glow
        this.tweens.add({
            targets: button,
            alpha: { from: 1, to: 0.8 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Version info
        this.add.text(390, 690, 'v2.0', {
            font: '11px Arial',
            fill: '#444444'
        }).setOrigin(1, 1);

        // Sound toggle hint
        this.add.text(10, 690, 'Sound ON', {
            font: '11px Arial',
            fill: '#444444'
        }).setOrigin(0, 1);

        // Decorative elements - floating enemies preview
        this.createFloatingPreviews();
    }

    createStarfield() {
        this.stars = [];
        
        // Portrait dimensions
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 400);
            const y = Phaser.Math.Between(0, 700);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
            
            const star = this.add.circle(x, y, size, 0xffffff, alpha);
            star.speed = size * 20;
            this.stars.push(star);
        }
    }

    createFloatingPreviews() {
        // Create some decorative sprites floating around the edges - portrait layout
        const positions = [
            { x: 40, y: 200 },
            { x: 360, y: 180 },
            { x: 50, y: 450 },
            { x: 350, y: 480 }
        ];

        positions.forEach((pos, i) => {
            const colors = [0x44ff44, 0xffff44, 0xff4444, 0xaa44ff];
            const enemy = this.add.circle(pos.x, pos.y, 10, colors[i]);
            enemy.setAlpha(0.5);

            // Floating animation
            this.tweens.add({
                targets: enemy,
                y: pos.y + Phaser.Math.Between(-15, 15),
                x: pos.x + Phaser.Math.Between(-8, 8),
                duration: Phaser.Math.Between(2000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Earth at bottom (decorative)
        const earth = this.add.circle(200, 650, 40, 0x2244aa);
        earth.setAlpha(0.3);
        
        // Mothership at top (decorative)
        const mothership = this.add.ellipse(200, -10, 80, 30, 0x443355);
        mothership.setAlpha(0.4);
        
        this.tweens.add({
            targets: mothership,
            x: { from: 120, to: 280 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update() {
        // Animate starfield - portrait bounds
        for (const star of this.stars) {
            star.y += star.speed * (1/60);
            if (star.y > 720) {
                star.y = -10;
                star.x = Phaser.Math.Between(0, 400);
            }
        }
    }
}
