class Loon {
    constructor(id, position) {
        this.id = id;
        this.level = 1;
        this.position = position;
        this.sprite = null;
    }

    setSprite(sprite) {
        this.sprite = sprite;
    }

    setLevel(level) {
        this.level = level;
    }

    updatePosition(newPosition) {
        this.position = newPosition;
        if (this.sprite) {
            this.sprite.setPosition(newPosition.x, newPosition.y);
        }
    }
}

export default Loon;