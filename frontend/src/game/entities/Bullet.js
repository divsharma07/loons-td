import Phaser from "phaser";

class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.scene = scene;
        this.setScale(0.02);
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.setVelocity(200, 0);
    }

    moveToTarget(targetX, targetY, speed) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    }
}

export default Bullet;