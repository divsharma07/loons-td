import Phaser from 'phaser';
import GamePanel from './Panel';
import Position from './Position';
import Loon from './Loon';
import Turret from './Turret';

const gameHeight = 500;
const gameWidth = 500;
const loonsKey = 'loons';
const loonsSpriteKey = 'loonSprites';
const turretsKey = 'turrets';
class Game extends Phaser.Scene {
    loonDissapearingCutOff = 5;
    constructor() {
        super('Game');
        // initializing turrets and loons
        this.loonSprites = ["b1"];
        this.turretSprites = ["t1", "t2"];
        this.activeTurrets = [];
        this.loons = {};
    }

    preload() {
        this.load.image('base_tiles', 'assets/base_tiles.png')
        this.load.tilemapTiledJSON('tilemap', 'assets/base_tiles.json')

        // load all loons
        this.loonSprites.forEach((loon) => {
            this.load.image(loon, `assets/${loon}.png`);
        });

        // load all turrets
        this.turretSprites.forEach((turret) => {
            this.load.image(turret, `assets/${turret}.png`);
        });
    }

    create() {
        this.registry.set(turretsKey, this.turretSprites);
        this.registry.set(loonsSpriteKey, this.loonSprites);
        this.registry.set(loonsKey, this.loons);
        // subscribe to turret dragging event
        
        // drawing the tile layers
        const map = this.make.tilemap({ key: 'tilemap' })
        // parameters need to match the config added to the json
        const tileset = map.addTilesetImage('standard_tiles', 'base_tiles')
        const background_Layer = map.createLayer('Background', tileset)
        const foreground_layer = map.createLayer('Foreground', tileset)
        const scaleX = (this.cameras.main.width) / background_Layer.width;
        const scaleY = this.cameras.main.height / background_Layer.height;
        const scale = Math.max(scaleX, scaleY);
        background_Layer.setScale(scale);
        foreground_layer.setScale(scale);
        // registering event that tracks turret placement
        this.events.on('createDraggableTurret', this.createDraggableTurret, this);
        this.registry.events.on('changedata', this.onRegistryChange, this);
    }

    createDraggableTurret(data) {
        let draggedTurret = new Turret(this, data.turretType, new Position(data.x, data.y),
         data.turretType, true).setInteractive();
        this.input.setDraggable(draggedTurret);
        draggedTurret.isTurret = true;
        draggedTurret.setData('isDragging', true);

        this.input.on('drag', (pointer, gameObject) => {
            if (gameObject.getData('isDragging')) {
                gameObject.x = pointer.x;
                gameObject.y = pointer.y;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject.getData('isDragging')) {
                // Finalize turret placement
                this.activeTurrets.push(gameObject);
                this.scene.bringToTop('GamePanel');
                gameObject.setData('isDragging', false);
                // Optional: Snap turret to grid or validate position here
            }
        });
    }

    onRegistryChange(parent, key, data) {
        if (key === loonsKey) {
            // The 'loonsKey' value has changed. Do something with the new value.
            console.log(data);
        }
    }

    startGame() {
        this.mockLoonGenerator()
        if (this.scene.get('GamePanel')) {
            // Start the existing scene
            this.scene.start('GamePanel');
        } else {
            // Add and start the new scene
            this.scene.add('GamePanel', GamePanel, true);
        }
    }

    destroy() {
        this.events.off('createDraggableTurret', this.createDraggableTurret, this);
    }

    mockLoonGenerator() {
        for(let id = 0; id < 10; id++) {
            let position = this.getRandomLocation();
            this.updateBalloonPositions({id: id, position: position});
        }
    }

    getRandomLocation() {
        const x = Phaser.Math.Between(0, this.sys.game.config.width);
        const y = Phaser.Math.Between(0, this.sys.game.config.height);
        return new Position(x, y);
    }

    clearLoons() {
        for (let id in this.loons) {
            if (this.loons.hasOwnProperty(id)) {
                this.loons[id].destroy();
            }
        }
        this.loons = {};
    }

    clearLoon(id) {
        if (this.loons.hasOwnProperty(id)) {
            this.loons[id].destroy();
            // updating loons in global registry
            this.registry.set('loons', this.loons);
        }
    }

    createLoon(id, position) {
        let loon = new Loon(this, id, position, this.getLoonType())
        this.loons[id] = loon;
        // updating register
        this.registry.set('loons', this.loons);
    }

    getLoonType() {
        return "b1";
    }

    updateBalloonPositions(newLoonData) {
        // making the loons dissapear once below a threshold
        if (newLoonData.position.x <= this.loonDissapearingCutOff) {
            this.clearLoon(newLoonData.id);
            this.loonDissapearingCutOff = Math.min(this.loonDissapearingCutOff, newLoonData.position.x);
        }
        let position = this.convertToPhaserCoordinates(newLoonData);

        if (this.loons[newLoonData.id]) {
            this.loons[newLoonData.id].updatePosition(position);
        } else {
            this.createLoon(newLoonData.id, position);
        }
    }

    convertToPhaserCoordinates(loon) {
        // Assuming -100 to 100 is the range for both x and y in server data
        const scaleX = gameWidth / 600;
        const scaleY = gameHeight / 200;

        // Translate and scale the coordinates
        const x = (loon.position.x+ 10);
        const y = (loon.position.y + 100);

        return new Position(x, y);
    }
}

const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    scene: [
        Game
    ]
};

const game = new Phaser.Game(config);

export default game;
