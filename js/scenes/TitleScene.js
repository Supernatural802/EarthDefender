// Title Scene - Start screen with game instructions
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Create animated starfield background
        this.createStarfield();

        // Game Title
        const title = this.add.text(400, 80, 'SAVE THE EARTH', {
            font: 'bold 52px Arial',
            fill: '#00ff88',
            stroke: '#004422',
            strokeThickness: 4
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
        this.add.text(400, 130, 'TAP DEFENSE', {
            font: '24px Arial',
            fill: '#aa44ff'
        }).setOrigin(0.5);

        // Instructions Panel
        const panelY = 280;
        const panel = this.add.rectangle(400, panelY, 600, 220, 0x1a1a2e, 0.9);
        panel.setStrokeStyle(2, 0x4a4a6a);

        // How to Play Header
        this.add.text(400, panelY - 90, 'HOW TO PLAY', {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            { icon: '👆', text: 'TAP enemies to shoot them before they damage Earth' },
            { icon: '🟢🟡🔴', text: 'Green = Easy | Yellow = Medium | Red = Hard' },
            { icon: '🟣', text: 'Destroy PURPLE enemies to get Power Cores' },
            { icon: '⚡', text: 'Collect 4 Power Cores to charge your MEGA BLAST' },
            { icon: '🎯', text: 'TAP the Mothership when charged to damage it' },
            { icon: '🏆', text: 'Destroy the Mothership to WIN!' }
        ];

        instructions.forEach((inst, index) => {
            const y = panelY - 55 + (index * 28);
            
            this.add.text(130, y, inst.icon, {
                font: '16px Arial'
            }).setOrigin(0.5);

            this.add.text(160, y, inst.text, {
                font: '14px Arial',
                fill: '#cccccc'
            }).setOrigin(0, 0.5);
        });

        // Tips
        this.add.text(400, 420, 'TIP: Shooting a shielded enemy damages the shield!', {
            font: 'italic 13px Arial',
            fill: '#888888'
        }).setOrigin(0.5);

        // Start Button (larger for mobile)
        const buttonY = 500;
        const button = this.add.rectangle(400, buttonY, 250, 70, 0x00aa66);
        button.setStrokeStyle(3, 0x00ff88);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(400, buttonY, 'START GAME', {
            font: 'bold 24px Arial',
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
        this.add.text(790, 590, 'v2.0', {
            font: '12px Arial',
            fill: '#444444'
        }).setOrigin(1, 1);

        // Sound toggle hint
        this.add.text(10, 590, 'Sound effects enabled', {
            font: '12px Arial',
            fill: '#444444'
        }).setOrigin(0, 1);

        // Decorative elements - floating enemies preview
        this.createFloatingPreviews();
    }

    createStarfield() {
        this.stars = [];
        
        for (let i = 0; i < 60; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
            
            const star = this.add.circle(x, y, size, 0xffffff, alpha);
            star.speed = size * 20;
            this.stars.push(star);
        }
    }

    createFloatingPreviews() {
        // Create some decorative sprites floating around the edges
        const positions = [
            { x: 60, y: 200 },
            { x: 740, y: 250 },
            { x: 80, y: 450 },
            { x: 720, y: 400 }
        ];

        positions.forEach((pos, i) => {
            const colors = [0x44ff44, 0xffff44, 0xff4444, 0xaa44ff];
            const enemy = this.add.circle(pos.x, pos.y, 12, colors[i]);
            enemy.setAlpha(0.6);

            // Floating animation
            this.tweens.add({
                targets: enemy,
                y: pos.y + Phaser.Math.Between(-20, 20),
                x: pos.x + Phaser.Math.Between(-10, 10),
                duration: Phaser.Math.Between(2000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Earth at bottom (decorative)
        const earth = this.add.circle(400, 620, 50, 0x2244aa);
        earth.setAlpha(0.4);
        
        // Mothership at top (decorative)
        const mothership = this.add.ellipse(400, -20, 100, 40, 0x443355);
        mothership.setAlpha(0.5);
        
        this.tweens.add({
            targets: mothership,
            x: { from: 300, to: 500 },
            duration: 4000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update() {
        // Animate starfield
        for (const star of this.stars) {
            star.y += star.speed * (1/60);
            if (star.y > 620) {
                star.y = -10;
                star.x = Phaser.Math.Between(0, 800);
            }
        }
    }
}
