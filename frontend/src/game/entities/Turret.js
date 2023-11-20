export class Turret {
    constructor(id, level, position) {
        this.id = id;
        this.level = level;
        this.position = position;
        this.sprite = null;
    }

    setSprite(sprite) {
        this.sprite = sprite;
    }

    updatePosition(newPosition) {
        this.position = newPosition;
        if (this.sprite) {
            this.sprite.setPosition(newPosition.x, newPosition.y);
        }
    }
}

export default Turret;