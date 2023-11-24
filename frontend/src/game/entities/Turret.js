import Phaser from 'phaser';
import Bullet from './Bullet';
import Loon from './Loon';
const loonsKey = 'loons';
const popLoonEventKey = 'popLoon'
class Turret extends Phaser.GameObjects.Sprite {
    constructor(scene, id, position, type, isActive, loonsGroup) {
        super(scene, position.x, position.y, type)
        this.id = id;
        this.level = TurretType[type];
        this.position = position;
        scene.add.existing(this);
        this.setScale(0.05);
        this.scene = scene;
        this.dragging = true;
        this.loonsGroup = loonsGroup;
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
        this.scene.physics.add.collider(this.bulletsGroup, this.loonsGroup, this.handleBulletBalloonCollision, null, this);
    }

    getNearestLoon() {
        let nearestDistance = Infinity;
        let nearestLoon = null;
        let loons = this.scene.registry.get(loonsKey);
        if (loons) {
            loons.forEach((loon, id) => {
                let distance = Phaser.Math.Distance.Between(this.x, this.y, loon.x, loon.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestLoon = id;
                }
            });
        }

        return nearestLoon;
    }

    isDragging() {
        return this.dragging;
    }

    setDragging(dragging) {
        this.dragging = dragging;
    }

    shoot() {
        if (!this.dragging) {
            let nearestLoon = this.getNearestLoon();
            if (nearestLoon === null) {
                return;
            }
            this.launchBullet(nearestLoon);
        }
    }

    launchBullet(nearestLoon) {
        let loons = this.scene.registry.get(loonsKey);
        let targetLoon = loons.get(nearestLoon);
        const bulletSpeed = 500; // Adjust speed as needed
        const bullet = new Bullet(this.scene, this.x, this.y, 'bullet');
        // adding to physics group to enable collision
        this.bulletsGroup.add(bullet);
        bullet.moveToTarget(targetLoon.position.x, targetLoon.position.y, bulletSpeed);
    }

    handleBulletBalloonCollision(bullet, loon) {
        let id = loon.id;

        // Delete the loon from the loons Map
        let loons = this.scene.registry.get(loonsKey);
        loons.delete(id);
        loon.destroy();
        bullet.destroy();
        // updating global registry
        this.scene.registry.set('loons', loons);
    }


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