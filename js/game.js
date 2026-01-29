// Phaser Game Configuration - Space Shooter (Mobile Ready)
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 400,
            height: 300
        },
        max: {
            width: 1600,
            height: 1200
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    input: {
        activePointers: 3, // Support multi-touch
        touch: {
            capture: true
        }
    },
    scene: [BootScene, TitleScene, GameScene]
};

// Create the game instance
const game = new Phaser.Game(config);

// Fullscreen toggle
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (game.scale.isFullscreen) {
        game.scale.stopFullscreen();
    } else {
        game.scale.startFullscreen();
    }
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        game.scale.refresh();
    }, 100);
});

// Handle resize
window.addEventListener('resize', () => {
    game.scale.refresh();
});
