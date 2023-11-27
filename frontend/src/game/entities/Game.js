import Phaser from 'phaser';
import GamePanel from './GamePanel';
import Position from './Position';
import Loon from './Loon';
import Turret from './Turret';

/**
 * Represents the game scene in the Loons TD game.
 */
class Game extends Phaser.Scene {
    /**
     * Creates a new instance of the Game scene.
     */
    constructor() {
        super('Game');
        // initializing turrets and loons
        this.loonSprites = ["BasicLoon", "AdvancedLoon"];
        this.turretSprites = ["BasicTurret", "AdvancedTurret"];
    }

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
        // loading plus button
        this.load.image("plusButton", "assets/plusButton.png");
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
        const scaleX = (this.sys.game.config.width) / background_Layer.width;
        const scaleY = this.sys.game.config.height / background_Layer.height;
        const scale = Math.max(scaleX, scaleY);
        background_Layer.setScale(scale);
        background_Layer.setPipeline('TextureTint');
        foreground_layer.setScale(scale);
        foreground_layer.setPipeline('TextureTint');

        // registering event that tracks turret placement
        this.events.on('createDraggableTurret', this.createDraggableTurret, this);
    }

    /**
     * Creates a draggable turret.
     * @param {Object} data - The data containing the turret type, position, and other details.
     */
    createDraggableTurret(data) {
        let draggedTurret = new Turret(this, data.turretType, new Position(data.x, data.y),
            data.turretType, true, this.loonsGroup, this.playerId).setInteractive();
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
                this.scene.bringToTop('GamePanel');
                gameObject.setDragging(false);
                // Optional: Snap turret to grid or validate position here
            }
        });
    }

    /**
     * Starts the game by either starting the existing GamePanel scene or adding and starting a new GamePanel scene.
     */
    startGame(playerId, initialCoins, inventory) {
        this.playerId = playerId;
        this.initialCoins = initialCoins;
        this.inventory = inventory;
        if (this.scene.get('GamePanel')) {
            // Start the existing scene
            this.scene.start('GamePanel');
        } else {
            // Add and start the new scene
            this.scene.add('GamePanel', new GamePanel(inventory, playerId, initialCoins), true);
        }
    }

    /**
     * Destroys the game scene.
     */
    destroy() {
        this.events.off('createDraggableTurret', this.createDraggableTurret, this);
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

    /**
     * Creates a new loon in the game.
     * @param {number} id - The ID of the loon.
     * @param {Position} position - The position of the loon.
     */
    createLoon(id, position, loonType) {
        let loon = new Loon(this, id, position, loonType)
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

    /**
    * Updates the position of a balloon in the game.
    * @param {Object} loonStateUpdate - The new loon data containing all loons with ID and position.
    */
    processLoonUpdates(loonStateUpdate) {
        this.loonsGroup.clear(true, true);
        loonStateUpdate.forEach((newLoonData) => {
            // we could scape up or scale down the server sent locations to the client but for now keeping them the same
            let position = new Position(newLoonData.position_x, newLoonData.position_y);

            // out of bounds check
            if (position.x <= this.loonDissapearingCutOff || position.y <= this.loonDissapearingCutOff
                || position.x >= (this.game.gameWidth - this.loonDissapearingCutOff)
                || position.y >= (this.game.gameHeight - this.loonDissapearingCutOff)) {
                // readjusting cutoff currently on the basis of minimum values in each wave
                this.loonDissapearingCutOff = Math.min(this.loonDissapearingCutOff, position.x, position.y);
            } else {
                this.createLoon(newLoonData.id, position, newLoonData.type);
            }
        });
    }
}

export default Game;
