import Phaser from 'phaser';
import GamePanel from './GamePanel';
import Position from './Position';
import Loon from './Loon';
import Turret from './Turret';

const loonsKey = 'loons';
/**
 * Represents the game scene in the Loons TD game.
 */
class Game extends Phaser.Scene {
    /**
     * Creates a new instance of the Game scene.
     * @param {Function} popLoonCallBack - The callback function to be called when a loon is popped.
     */
    constructor(popLoonCallBack) {
        super('Game');
        // initializing turrets and loons
        this.loonSprites = ["b1"];
        this.turretSprites = ["t1", "t2"];
        this.activeTurrets = [];
    }

    // getLoons() {
    //     return this.registry.get(loonsKey);
    // }

    // setLoons(loons) {
    //     this.registry.set(loonsKey, loons);
    // }

    /**
     * Preloads all the assets required for the game.
     */
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

    /**
     * Creates the game scene.
     */
    create() {
        this.registry.set('turrets', this.turretSprites);
        this.registry.set('loonSprites', this.loonSprites);
        // this.setLoons(new Map());
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

    /**
     * Creates a draggable turret.
     * @param {Object} data - The data containing the turret type, position, and other details.
     */
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

    /**
     * Starts the game by either starting the existing GamePanel scene or adding and starting a new GamePanel scene.
     */
    startGame() {
        if (this.scene.get('GamePanel')) {
            // Start the existing scene
            this.scene.start('GamePanel');
        } else {
            // Add and start the new scene
            this.scene.add('GamePanel', GamePanel, true);
        }
    }

    /**
     * Updates the game state.
     */
    update() {
        // let loons = this.registry.get('loons');
        // loons.forEach((value, id) => {
        //     if(value.active) {
        //         this.updateBalloonPositions({id: id, position: value.position});
        //     }
        // });
    }

    /**
     * Destroys the game scene.
     */
    destroy() {
        this.events.off('createDraggableTurret', this.createDraggableTurret, this);
        this.registry.events.on('changedata', this.onRegistryChange, this);
    }

    /**
     * Generates mock loons for testing purposes.
     */
    mockLoonGenerator() {
        for (let id = 0; id < 100; id++) {
            let position = this.getRandomLocation();
            this.updateBalloonPosition({ id: id, position: position });
        }
    }

    /**
     * Generates a random location within the game bounds.
     * @returns {Position} - The randomly generated position.
     */
    getRandomLocation() {
        const x = Phaser.Math.Between(0, this.game.gameWidth);
        const y = Phaser.Math.Between(0, this.game.gameHeight);
        return new Position(x, y);
    }

    // /**
    //  * Clears a loon from the game.
    //  * @param {number} id - The ID of the loon to be cleared.
    //  */
    // clearLoon(id) {
    //     let loon = this.loons.get(id);
    //     if (loon) {
    //         loon.destroy();
    //     }
    //     this.loons.delete(id);
    //     this.registry.set('loons', this.loons);
    // }

    /**
     * Creates a new loon in the game.
     * @param {number} id - The ID of the loon.
     * @param {Position} position - The position of the loon.
     */
    createLoon(id, position) {
        let loon = new Loon(this, id, position, this.getLoonType())
        // let loons = this.getLoons();
        // loons.set(id, loon);
        // adding to the physics group to enable collision
        this.loonsGroup.add(loon);
        // updating register
        // this.setLoons(loons);
    }

    /**
     * Gets the type of loon to be created.
     * @returns {string} - The type of loon.
     */
    getLoonType() {
        return "b1";
    }

    processLoonUpdates(loonStateUpdate) {
        this.loonsGroup.clear(true, true);
        loonStateUpdate.forEach((newLoonData) => {
            let position = new Position(newLoonData.position_x, newLoonData.position_y);

            // out of bounds check
            if (position.x <= this.loonDissapearingCutOff || position.y <= this.loonDissapearingCutOff
                || position.x >= (this.game.gameWidth - this.loonDissapearingCutOff) 
                    || position.y >= (this.game.gameHeight - this.loonDissapearingCutOff)) {
                // readjusting cutoff currently on the basis of minimum values in each wave
                this.loonDissapearingCutOff = Math.min(this.loonDissapearingCutOff, position.x, position.y);
            } else {
                this.createLoon(newLoonData.id, position);
            }
        });
    }

    // /**
    //  * Updates the position of a balloon in the game.
    //  * @param {Object} newLoonData - The new loon data containing the ID and position.
    //  */
    // updateBalloonPosition(newLoonData) {
    //     let position = new Position(newLoonData.position_x, newLoonData.position_y);

    //     // out of bounds check
    //     if (position.x <= this.loonDissapearingCutOff || position.y <= this.loonDissapearingCutOff
    //         || position.x >= (this.gameWidth - this.loonDissapearingCutOff 
    //             || position.y >= (this.gameHeight - this.loonDissapearingCutOff))) {
    //         this.clearLoon(newLoonData.id);
    //         // readjusting cutoff currently on the basis of minimum values in each wave
    //         this.loonDissapearingCutOff = Math.min(this.loonDissapearingCutOff, position.x, position.y);
    //     }
        
    //     this.createLoon(newLoonData.id, position);
    // }

    /**
     * Converts the loon coordinates from server data to Phaser coordinates.
     * @param {Loon} loon - The loon object.
     * @returns {Position} - The converted Phaser coordinates.
     */
    convertToPhaserCoordinates(loon) {
        // Assuming -100 to 100 is the range for both x and y in server data
        const scaleX = this.gameWidth / 600;
        const scaleY = this.gameHeight / 200;

        // Translate and scale the coordinates
        const x = (loon.position.x + 10);
        const y = (loon.position.y + 100);

        return new Position(x, y);
    }
}

export default Game;
