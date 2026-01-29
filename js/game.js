// Phaser Game Configuration - Space Shooter (Full Screen Mobile)
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 400,
        height: 700
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    input: {
        activePointers: 3,
        touch: {
            capture: true
        }
    },
    scene: [BootScene, TitleScene, GameScene]
};

// Create the game instance
const game = new Phaser.Game(config);

// Resize handler to make game fill screen
function resizeGame() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowRatio = windowWidth / windowHeight;
        const gameRatio = 400 / 700;
        
        if (windowRatio < gameRatio) {
            canvas.style.width = windowWidth + 'px';
            canvas.style.height = (windowWidth / gameRatio) + 'px';
        } else {
            canvas.style.width = (windowHeight * gameRatio) + 'px';
            canvas.style.height = windowHeight + 'px';
        }
    }
}

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeGame, 100);
});

// Initial resize after game loads
setTimeout(resizeGame, 100);
