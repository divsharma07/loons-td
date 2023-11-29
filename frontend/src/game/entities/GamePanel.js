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
        this.scoreText = null;
        this.coinsText = null;
        this.coins = coins;
        this.score = 0;
        this.turrets = new Map(); 
    }

    /**
     * This reset the panel and all its data.
     * This is essentially a workaround for removing and adding a new panel, but doing that
     * was causing issues with events.
     * TODO: do this the right way and figure out events related issue.
     * @param {InventoryItem} inventory item 
     * @param {number} playerId new player id 
     * @param {number} initialCoins new player initial coins 
     */
    reset(inventory, playerId, initialCoins) {
        this.inventory = inventory;
        this.playerId = playerId;
        this.initialCoins = initialCoins;
        this.updatePanel(initialCoins);
    }

    /**
     * Creates the game panel and its elements.
     * @method
     */
    create() {
        // setting up relevant events
        this.game.events.on(refreshItemsKey, (inventory) => this.refreshItems(inventory), true);
        this.game.events.on(scoreUpdateKey, (score) => {
            this.scoreUpdate(score);
        }, this);
        this.game.events.on(coinUpdateKey, (coins) => {
            this.coinUpdate(coins);
        }, this);
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
                this.turrets.set(eachTurret.item_name, currTurret);  // Change this line
                // this.addCountToSprite(eachTurret.item_name, currTurret, eachTurret.quantity);
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
                this.useItem(name, item)
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
        if(typeof coins === 'undefined') {
            return
        }
        this.coins = coins;
        this.coinsText.setText('coins: ' + this.coins)
    }

        /**
     * Uses an item from the inventory.
     * @method
     * @param {string} itemId - The ID of the item to use.
     */
    useItem(itemId, item) {
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
            .then(data => {
                // this.scene.game.events.emit(refreshItemKey, data.inventory_item);
                item.quantity = data.inventory_item.quantity;
                item.countText.setText(item.quantity.toString());
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    /**
     * Updates the panel, using a stored map that contains a reference to all the sprites.
     */
    updatePanel() {
        this.inventory.forEach((inventoryItem) => {
            // Get the corresponding turret from this.turrets
            const turret = this.turrets.get(inventoryItem.item_name);

            // If the turret was found, update its countText
            if (turret) {
                turret.playerId = this.playerId;
                turret.quantity = inventoryItem.quantity;
                turret.countText.setText(inventoryItem.quantity.toString());
            }
        });

        this.coinsText.setText('coins: ' + this.initialCoins);
        this.scoreText.setText('score: 0');
    }
}



export default GamePanel;