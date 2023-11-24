import Phaser from 'phaser';
class Loon extends Phaser.GameObjects.Sprite {
    constructor(scene, id, position, type) {
        super(scene, position.x, position.y, type)
        this.id = id;
        this.level = LoonType[type];
        this.position = position;
        scene.add.existing(this);
        this.scene = scene;
        this.scene.physics.add.existing(this);
        this.setScale(0.02);
    }

    updatePosition(newPosition) {
        this.position = newPosition;
        if (this.sprite) {
            this.sprite.setPosition(newPosition.x, newPosition.y);
        }
    }
}

const LoonType = {
    b1: 1,
};

export default Loon;