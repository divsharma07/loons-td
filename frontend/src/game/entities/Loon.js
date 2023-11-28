import Phaser from 'phaser';

/**
 * Represents a Loon entity in the game.
 * @class
 * @extends Phaser.GameObjects.Sprite
 */
class Loon extends Phaser.GameObjects.Sprite {
    /**
     * Creates a new instance of the Loon class.
     * @constructor
     * @param {Phaser.Scene} scene - The scene to which the Loon belongs.
     * @param {number} id - The unique identifier of the Loon.
     * @param {Phaser.Math.Vector2} position - The initial position of the Loon.
     * @param {string} type - The type of the Loon.
     */
    constructor(scene, id, position, type) {
        super(scene, position.x, position.y, type)
        this.id = id;
        this.level = LoonType[type];
        this.position = position;
        scene.add.existing(this);
        this.scene = scene;
        this.scene.physics.add.existing(this);
        this.setScale(0.03);
    }

    /**
     * Updates the position of the Loon.
     * @param {Phaser.Math.Vector2} newPosition - The new position of the Loon.
     */
    updatePosition(newPosition) {
        this.position = newPosition;
        if (this && this.active) {
            this.setPosition(newPosition.x, newPosition.y);
        }
    }
}

/**
 * Represents the types of Loons.
 * @enum {number}
 */
const LoonType = {
    BasicLoon: 1,
    AdvancedLoon: 2
};

export default Loon;