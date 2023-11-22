import Phaser from 'phaser';

const loonsKey = 'loons'; 
class Turret extends Phaser.GameObjects.Sprite {
    constructor(scene, id, position, type, isActive) {
        super(scene, position.x, position.y, type)
        this.id = id;
        this.level = TurretType[type];
        this.position = position;
        scene.add.existing(this);
        this.setScale(0.05);
        this.scene = scene;

        if(isActive) {
            this.shootTimer = this.scene.time.addEvent({
                delay: 1000, // 1000 milliseconds = 1 second
                callback: this.shoot,
                callbackScope: this,
                loop: true
            });
        }
    }

    getNearestLoon() {
        let nearestDistance = Infinity;
        let nearestLoon = null;
        let loons =  this.scene.registry.get(loonsKey);
        Object.keys(loons).forEach((id) => {
            let loon = loons[id];
            let distance = Phaser.Math.Distance.Between(this.x, this.y, loon.x, loon.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestLoon = loon;
            }
        });

        return nearestLoon;
    }

    shoot() {
        let nearestLoon = this.getNearestLoon();
        nearestLoon.pop();
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