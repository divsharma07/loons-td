import Phaser from 'phaser';
import Turret from './Turret';
import Position from './Position';

const scoreUpdateKey = 'scoreUpdate'
const refreshItemsKey = 'refreshItems'
const coinUpdateKey = 'coinUpdate'
const serverAddr = process.env.REACT_APP_SERVER_URL;



/**
 * Represents the game panel in the game scene.
 */
class GamePanel extends Phaser.Scene {
    /**
     * Array that defines the allocation of turrets in the game panel.
     * @type {Array<{type: string, count: string}>}
     */

    constructor(inventory, playerId, coins) {
        super({ key: 'GamePanel' });
        this.inventory = inventory;
        this.playerId = playerId;
        this.inventorySpritesMap = new Map();
        this.scoreText = null;
        this.coinsText = null;
        this.coins = coins;
        this.score = 0;
    }

    /**
     * Creates the game panel and its elements.
     * @method
     */
    create() {
        // setting up relevant events
        this.game.events.on(refreshItemsKey, (inventory) => this.refreshItems(inventory), this);
        this.game.events.on(scoreUpdateKey, (score) => {
            this.scoreUpdate(score);
        });
        this.game.events.on(coinUpdateKey, (coins) => {
            this.coinUpdate(coins);
        });
        const gameHeight = this.game.config.height;
        const panelHeight = 50;
        const panelWidth = this.game.config.width;
        const turretXStart = 50;
        const turretSpacing = 50;
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.1);
        panel.fillRect(0, gameHeight - panelHeight, panelWidth, panelHeight);
        this.inventory.forEach((eachTurret, i) => {
            if (eachTurret.quantity > 0) {
                const turretX = turretXStart + (i * turretSpacing); // Calculate Y position
                const currTurret = new Turret(this, eachTurret.item_name, new Position(turretX, gameHeight - (panelHeight / 2)),
                    eachTurret.item_name, false, null, this.playerId, true, eachTurret.quantity);
                // this.addCountToSprite(eachTurret.item_name, currTurret, eachTurret.quantity);
                this.inventorySpritesMap.set(eachTurret.item_name, currTurret);
                // Make turrets interactive, etc.
                currTurret.setInteractive();
                // this.input.setDraggable(turret);
                currTurret.on('pointerdown', (pointer) => {
                    if (currTurret.quantity > 0) {
                        this.scene.bringToTop('Game');
                        this.scene.get('Game').events.emit('createDraggableTurret', { x: pointer.worldX, y: pointer.worldY, turretType: eachTurret.item_name });
                        this.pickItem(eachTurret.item_name, currTurret)
                    }
                });
            }
        });
        const textSpacing = turretXStart + (this.inventory.length * turretSpacing);
        this.scoreText = this.add.text(textSpacing, gameHeight - (panelHeight - 5), 'score: ' + this.score, { fontSize: '20px', fill: '#000' });
        this.coinsText = this.add.text(textSpacing, gameHeight - (panelHeight - 25), 'coins: ' + this.coins, { fontSize: '20px', fill: '#000' });
        // Add UI elements to the panel
    }

        /**
     * Picks an item from the inventory.
     * @method
     * @param {string} name - The name of the item.
     * @param {object} item - The item object.
     */
    pickItem(name, item) {
        if (item !== null) {
            if (item && item.quantity > 0) {
                item.quantity--;
                this.inventorySpritesMap.set(name, item);
                this.useItem(name)
                item.countText.setText(item.quantity.toString());
            }
        }
    }

        /**
     * Updates the score.
     * @method
     * @param {number} score - The new score value.
     */
    scoreUpdate(score) {
        this.score = score;
        this.scoreText.setText('score: ' + this.score)
    }

        /**
     * Updates the number of coins.
     * @method
     * @param {number} coins - The new number of coins.
     */
    coinUpdate(coins) {
        this.coins = coins;
        this.coinsText.setText('coins: ' + this.coins)
    }

        /**
     * Uses an item from the inventory.
     * @method
     * @param {string} itemId - The ID of the item to use.
     */
    useItem(itemId) {
        const useUrl = `http://${serverAddr}/game/use/`
        fetch(useUrl, {
            method: 'POST',
            body: JSON.stringify({
                itemId: itemId,
                playerId: this.playerId,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    /**
     * Adds the count text to the turret sprite.
     * @method
     * @param {string} turretName - The name of the turret.
     * @param {Phaser.GameObjects.Sprite} sprite - The turret sprite.
     * @param {number} count - The count to display.
     */
    addCountToSprite(turretName, sprite, count) {
        // let container = this.add.container(sprite.x, sprite.y);
        // container.add(sprite);
        const countText = this.add.text(sprite.x - 5, sprite.y + 10, count.toString(), {
            fontSize: '12px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0);
        countText.setVisible(true);
        // Store the text object in the sprite for easy access
        sprite.countText = countText;
        this.inventorySpritesMap.set(turretName, sprite);
    }
}



export default GamePanel;