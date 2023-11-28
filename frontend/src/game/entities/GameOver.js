import Phaser from 'phaser';

class GameOver extends Phaser.Scene {
    constructor(coins, score) {
        super({ key: 'GameOver' });
        this.score = score;
        this.coins = coins;
    }

    create() {
        this.add.text(300, 250, `Game Over\nScore: ${this.score}\nCoins: ${this.coins}`, { fontSize: '64px', fill: '#000' });
    }
}

export default GameOver;