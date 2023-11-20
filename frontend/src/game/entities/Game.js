import Phaser from 'phaser';

class Game extends Phaser.Scene {
    constructor() {
        super('LoonsTDGame');
    }

    preload() {
        this.load.image('base_tiles', 'assets/base_tiles.png')
        this.load.tilemapTiledJSON('tilemap', 'assets/base_tiles.json')
        this.load.image('balloon', 'assets/balloon.png');
    }

    create() {

        // drawing the tile layers
        const map = this.make.tilemap({ key: 'tilemap' })
        // parameters need to match the config added to the json
        const tileset = map.addTilesetImage('standard_tiles', 'base_tiles')        
        const background_Layer = map.createLayer('Background', tileset)
        const foreground_layer = map.createLayer('Foreground', tileset)
        const scaleX = this.cameras.main.width / background_Layer.width;
        const scaleY = this.cameras.main.height / background_Layer.height;
        const scale = Math.max(scaleX, scaleY);
        background_Layer.setScale(scale);
        foreground_layer.setScale(scale);
        this.balloon = this.add.sprite(100, 200, 'balloon');
        this.balloon.setScale(0.06)
    }

    update() {
        // Game loop: update game logic
        const gameWidth = this.sys.game.config.width;
        this.balloon.x =  (this.balloon.x + 1)% gameWidth;
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: Game
    // Add other configuration settings as needed
};

const game = new Phaser.Game(config);

export default game;
