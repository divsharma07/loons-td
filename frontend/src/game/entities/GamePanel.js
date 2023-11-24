import Phaser from 'phaser';
import Turret from './Turret';
import Position from './Position';


const turretsKey = 'turrets';
class GamePanel extends Phaser.Scene {
    turretAllocation = [
        { type: "t1", count: "3" },
        { type: "t2", count: "2" }
    ];

    constructor() {
        super({ key: 'GamePanel' });
    }

    create() {
        this.turretSprites = this.registry.get(turretsKey)
        const gameHeight = this.game.config.height;
        const panelHeight = 50;
        const panelWidth = this.game.config.width;
        const turretXStart = 50;
        const turretSpacing = 50;
        const panel = this.add.graphics();
        panel.fillStyle(0x000000, 0.1);
        panel.fillRect(0, gameHeight - panelHeight, panelWidth, panelHeight);
        this.turretAllocation.forEach((eachTurret, i) => {
            if (eachTurret.count > 0) {
                const turretX = turretXStart + (i * turretSpacing); // Calculate Y position
                const currTurret = new Turret(this, eachTurret.type, new Position(turretX, gameHeight - (panelHeight / 2)),
                 eachTurret.type, false);
                this.addCountToSprite(currTurret, eachTurret.count);
                // saving sprint in the map
                eachTurret.sprite = currTurret;
                // Make turrets interactive, etc.
                currTurret.setInteractive();

                // this.input.setDraggable(turret);
                currTurret.on('pointerdown', (pointer) => {
                    this.scene.bringToTop('Game');
                    this.scene.get('Game').events.emit('createDraggableTurret', { x: pointer.worldX, y: pointer.worldY, turretType: this.turretSprites[i] });
                    eachTurret.count--;
                    this.refreshTurretIcons();
                });
            }
        });

        // Add UI elements to the panel
    }

    addCountToSprite(sprite, count) {
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
        // container.add(countText);
    }

    refreshTurretIcons() {
        this.turretAllocation.forEach((eachTurret, i) => {
            if (eachTurret.count <= 0) {
                eachTurret.sprite.visible = false;
                eachTurret.sprite.countText.setVisible(false);
            } else if (eachTurret.sprite.countText) {
                eachTurret.sprite.countText.setText(eachTurret.count.toString());
            }
        });
    }
}

export default GamePanel;