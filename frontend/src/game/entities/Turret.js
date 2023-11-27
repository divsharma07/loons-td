import Phaser from 'phaser';
import Bullet from './Bullet';

const loonsKey = 'loons';
const popLoonEventKey = 'popLoon'
/**
 * Represents a Turret entity in the game.
 * @class
 * @extends Phaser.GameObjects.Sprite
*/
class Turret extends Phaser.GameObjects.Sprite {
    /**
     * Creates a new Turret instance.
     * @constructor
     * @param {Phaser.Scene} scene - The scene to which the Turret belongs.
     * @param {number} id - The ID of the Turret.
     * @param {Phaser.Math.Vector2} position - The position of the Turret.
     * @param {string} type - The type of the Turret.
     * @param {boolean} isActive - Indicates if the Turret is active.
     * @param {Phaser.Physics.Arcade.Group} loonsGroup - The group of loons in the game.
     */
    constructor(scene, id, position, type, isActive, loonsGroup, playerId) {
        super(scene, position.x, position.y, type);
        this.id = id;
        this.level = TurretType[type];
        this.position = position;
        scene.add.existing(this);
        this.setScale(0.05);
        this.scene = scene;
        this.dragging = true;
        this.loonsGroup = loonsGroup;
        this.playerId = playerId;
        this.bulletsGroup = this.scene.physics.add.group({
            classType: Bullet,
        });
        if (isActive) {
            this.shootTimer = this.scene.time.addEvent({
                delay: 1000, // 1000 milliseconds = 1 second
                callback: this.shoot,
                callbackScope: this,
                loop: true
            });
        }
        this.scene.physics.add.collider(this.bulletsGroup, this.loonsGroup, this.handleBulletLoonCollision, null, this);
    }

    /**
     * Gets the ID of the nearest loon to the Turret.
     * @returns {number|null} The ID of the nearest loon, or null if no loons are present.
     */
    getNearestLoon() {
        let nearestDistance = Infinity;
        let nearestLoon = null;
        // let loons = this.getLoons()
        let loons = this.loonsGroup.getChildren();
        if (loons) {
            for (let loon of loons) {
                if (!loon.active) {
                    continue;
                }
                let distance = Phaser.Math.Distance.Between(this.x, this.y, loon.x, loon.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestLoon = loon;
                }
            }
        }

        return nearestLoon;
    }

    /**
     * Checks if the Turret is currently being dragged.
     * @returns {boolean} True if the Turret is being dragged, false otherwise.
     */
    isDragging() {
        return this.dragging;
    }

    /**
     * Sets the dragging state of the Turret.
     * @param {boolean} dragging - The dragging state to set.
     */
    setDragging(dragging) {
        this.dragging = dragging;
    }

    /**
     * Shoots a bullet from the Turret towards the nearest loon.
     */
    shoot() {
        if (!this.dragging) {
            let nearestLoon = this.getNearestLoon();
            if (nearestLoon === null) {
                return;
            }
            this.launchBullet(nearestLoon);
        }
    }

    /**
     * Launches a bullet from the Turret towards a target loon.
     * @param {number} nearestLoon - The ID of the nearest loon.
     */
    launchBullet(nearestLoon) {
        const bulletSpeed = 500; // Adjust speed as needed
        const bullet = new Bullet(this.scene, this.x, this.y, 'bullet');
        // adding to physics group to enable collision
        this.bulletsGroup.add(bullet);
        bullet.moveToTarget(nearestLoon.position.x, nearestLoon.position.y, bulletSpeed);
    }

    /**
     * Handles the collision between a bullet and a loon.
     * @param {Bullet} bullet - The bullet object.
     * @param {Phaser.GameObjects.Sprite} loon - The loon object.
     */
    handleBulletLoonCollision(bullet, loon) {
        let id = loon.id;

        if (loon.active) {
            this.loonsGroup.remove(loon, true);
            // removing loon from physics group and also deleting it
            this.scene.game.events.emit(popLoonEventKey, id, this.playerId);
            bullet.destroy();
        } else {
            bullet.destroy();
            console.log("loon inactive");
        }
    }

    /**
     * Destroys the Turret.
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

const TurretType = {
    t1: 1,
    t2: 2
};

export default Turret;