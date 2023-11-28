import Phaser from 'phaser';

class GameOver extends Phaser.Scene {
    constructor(coins, score) {
        super({ key: 'GameOver' });
        this.score = score;
        this.coins = coins;
    }

    create() {
        const { width, height } = this.scale;
        const gameOverText = `Game Over\nScore: ${this.score}\nCoins: ${this.coins}`;
        const text = this.add.text(width / 2, height / 2, gameOverText, { fontSize: '64px', fill: '#000' });
        text.setOrigin(0.5);
    }
}

export default GameOver;