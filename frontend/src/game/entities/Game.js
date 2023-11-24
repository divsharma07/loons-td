import Phaser from 'phaser';
import GamePanel from './GamePanel';
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
        this.loons = new Map();
    }

    preload() {
        // preloading all sprites and images
        this.load.image('base_tiles', 'assets/base_tiles.png');
        this.load.tilemapTiledJSON('tilemap', 'assets/base_tiles.json');
        this.load.image("bullet", "assets/bullet.png");
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

        // Create a physics group for loons
        this.loonsGroup = this.physics.add.group({
            classType: Loon,
        });

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
    }

    createDraggableTurret(data) {
        let draggedTurret = new Turret(this, data.turretType, new Position(data.x, data.y),
            data.turretType, true, this.loonsGroup).setInteractive();
        this.input.setDraggable(draggedTurret);
        draggedTurret.isTurret = true;

        this.input.on('drag', (pointer, gameObject) => {
            if (gameObject.isDragging()) {
                gameObject.x = pointer.x;
                gameObject.y = pointer.y;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject.isDragging()) {
                // Finalize turret placement
                this.activeTurrets.push(gameObject);
                this.scene.bringToTop('GamePanel');
                gameObject.setDragging(false);
                // Optional: Snap turret to grid or validate position here
            }
        });
    }



    // onRegistryChange(parent, key, data) {
    //     if (key === loonsKey) {
    //         // The 'loonsKey' value has changed. Do something with the new value.
    //         if(data !== undefined) {
    //             data.forEach((value, id) => {
    //                 this.updateBalloonPositions({id: id, position: value.position});
    //             });
    //         }

    //     }
    // }

    startGame() {
        this.mockLoonGenerator();
        if (this.scene.get('GamePanel')) {
            // Start the existing scene
            this.scene.start('GamePanel');
        } else {
            // Add and start the new scene
            this.scene.add('GamePanel', GamePanel, true);
        }
    }

    update() {
        // let loons = this.registry.get(loonsKey);
        // loons.forEach((value, id) => {
        //     if(value.active) {
        //         this.updateBalloonPositions({id: id, position: value.position});
        //     }
        // });
    }

    destroy() {
        this.events.off('createDraggableTurret', this.createDraggableTurret, this);
        this.registry.events.on('changedata', this.onRegistryChange, this);
    }

    mockLoonGenerator() {
        for (let id = 0; id < 100; id++) {
            let position = this.getRandomLocation();
            this.updateBalloonPositions({ id: id, position: position });
        }
    }

    getRandomLocation() {
        const x = Phaser.Math.Between(0, gameWidth);
        const y = Phaser.Math.Between(0, gameHeight);
        return new Position(x, y);
    }

    // gets triggered when the game deletes the loon and it goes out of bounds
    clearLoon(id) {
        let loon = this.loons.get(id);
        if (loon) {
            loon.destroy();
        }
        this.loons.delete(id);
        this.registry.set('loons', this.loons);
    }

    createLoon(id, position) {
        let loon = new Loon(this, id, position, this.getLoonType())
        this.loons.set(id, loon);
        // adding to the physics group to enable collision
        this.loonsGroup.add(loon);
        // updating register
        this.registry.set('loons', this.loons);
    }

    getLoonType() {
        return "b1";
    }

    updateBalloonPositions(newLoonData) {
        let position = newLoonData.position;

        // out of bounds check
        if (position.x <= this.loonDissapearingCutOff || position.y <= this.loonDissapearingCutOff
            || position.x >= (gameWidth - this.loonDissapearingCutOff 
                || position.y >= (gameHeight - this.loonDissapearingCutOff))) {
            this.clearLoon(newLoonData.id);
            // readjusting cutoff currently on the basis of minimum values in each wave
            this.loonDissapearingCutOff = Math.min(this.loonDissapearingCutOff, position.x, position.y);
        }

        if (this.loons.has(newLoonData.id)) {
            this.loons.get(newLoonData.id).updatePosition(position);
        } else {
            this.createLoon(newLoonData.id, position);
        }
    }

    convertToPhaserCoordinates(loon) {
        // Assuming -100 to 100 is the range for both x and y in server data
        const scaleX = gameWidth / 600;
        const scaleY = gameHeight / 200;

        // Translate and scale the coordinates
        const x = (loon.position.x + 10);
        const y = (loon.position.y + 100);

        return new Position(x, y);
    }
}


export default Game;
