/**
 * InventoryScene.js
 * 背包與英雄列表介面
 */
class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InventoryScene' });
    }

    create() {
        this.add.rectangle(225, 400, 450, 800, 0x1a2a1a);
        this.add.text(225, 50, "英雄背包", { fontSize: '32px', color: '#44ff44' }).setOrigin(0.5);

        // 列出所有擁有的英雄
        logic.heroes.forEach((hero, index) => {
            let y = 150 + (index * 70);
            this.add.rectangle(225, y, 400, 60, 0x333333).setStrokeStyle(1, 0x666666);
            this.add.text(50, y, `[${hero.rarity}] ${hero.name}`, { fontSize: '18px' }).setOrigin(0, 0.5);
            this.add.text(380, y, `LV.${hero.lv}`, { fontSize: '16px', color: '#aaaaaa' }).setOrigin(1, 0.5);
        });

        // 返回按鈕
        let backBtn = this.add.text(225, 720, "返回主選單", { fontSize: '24px', color: '#ffff00' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
            
        backBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
