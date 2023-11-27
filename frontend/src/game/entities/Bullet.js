import Phaser from "phaser";

/**
 * Represents a bullet entity in the game.
 * @class
 * @extends Phaser.GameObjects.Sprite
 */
class Bullet extends Phaser.GameObjects.Sprite {
    /**
     * Creates a new instance of the Bullet class.
     * @constructor
     * @param {Phaser.Scene} scene - The scene to which the bullet belongs.
     * @param {number} x - The x-coordinate of the bullet's initial position.
     * @param {number} y - The y-coordinate of the bullet's initial position.
     * @param {string} texture - The texture key of the bullet.
     */
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.scene = scene;
        this.setScale(0.02);
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.setVelocity(200, 0);
    }

    /**
     * Moves the bullet towards a target position with a specified speed.
     * @param {number} targetX - The x-coordinate of the target position.
     * @param {number} targetY - The y-coordinate of the target position.
     * @param {number} speed - The speed at which the bullet moves towards the target.
     */
    moveToTarget(targetX, targetY, speed) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    }
}

export default Bullet;