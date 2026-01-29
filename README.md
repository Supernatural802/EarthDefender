# Phaser 3 Sprite Sheet Game Starter

A basic Phaser 3 game template with sprite sheet support and player movement.

## Project Structure

```
phaser-game/
├── index.html              # Main HTML file
├── js/
│   ├── game.js            # Game configuration
│   └── scenes/
│       ├── BootScene.js   # Asset loading & animations
│       └── GameScene.js   # Main game logic
├── assets/
│   └── player.png         # Player sprite sheet (you need to add this!)
└── tools/
    └── generate-placeholder-sprite.html  # Sprite generator tool
```

## Quick Start

### Step 1: Generate a Placeholder Sprite

1. Open `tools/generate-placeholder-sprite.html` in your browser
2. Click "Download Sprite Sheet"
3. Move the downloaded `player.png` to the `assets/` folder

### Step 2: Run the Game

Since Phaser loads assets via HTTP, you need a local server:

**Option A: Python (recommended)**
```bash
cd phaser-game
python3 -m http.server 8000
# Then open: http://localhost:8000
```

**Option B: Node.js**
```bash
npx serve
# Or: npx http-server
```

**Option C: VS Code / Cursor**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

## Controls

- **Arrow Keys** or **WASD**: Move the player
- Player animates based on movement direction

## Sprite Sheet Format

The template expects a sprite sheet with:
- **Frame size**: 32×32 pixels
- **Layout**: 4 columns × 4 rows (16 frames total)

| Row | Frames | Animation |
|-----|--------|-----------|
| 1   | 0-3    | Walk Down / Idle |
| 2   | 4-7    | Walk Up |
| 3   | 8-11   | Walk Left |
| 4   | 12-15  | Walk Right |

## Customization

### Change Player Speed
In `GameScene.js`:
```javascript
this.moveSpeed = 160; // Adjust this value
```

### Add New Sprites
In `BootScene.js` preload():
```javascript
this.load.spritesheet('enemy', 'assets/enemy.png', {
    frameWidth: 32,
    frameHeight: 32
});
```

### Add New Animations
In `BootScene.js` createAnimations():
```javascript
this.anims.create({
    key: 'enemy-walk',
    frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
});
```

### Enable Physics Debug
In `game.js`:
```javascript
physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 0 },
        debug: true  // Shows collision boxes
    }
}
```

## Resources

### Free Sprite Sheets
- [OpenGameArt.org](https://opengameart.org/)
- [itch.io Game Assets](https://itch.io/game-assets/free)
- [Kenney.nl](https://kenney.nl/assets)

### Phaser Documentation
- [Phaser 3 API Docs](https://newdocs.phaser.io/docs/3.70.0)
- [Phaser 3 Examples](https://phaser.io/examples)

## Next Steps

1. Replace the placeholder sprite with your own character art
2. Add a tilemap for level design
3. Add enemies and collectibles
4. Implement game mechanics (health, score, etc.)
5. Add sound effects and music
