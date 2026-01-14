class StoreScene extends Phaser.Scene {
    constructor() { super({ key: 'StoreScene' }); }

    create() {
        this.add.text(225, 50, "召喚商店", { fontSize: '32px' }).setOrigin(0.5);
        
        // 抽卡按鈕
        let drawBtn = this.add.rectangle(225, 400, 200, 80, 0xaa00ff).setInteractive();
        this.add.text(225, 400, "召喚英雄\n(10 💎)", { align: 'center' }).setOrigin(0.5);

        drawBtn.on('pointerdown', () => {
            let hero = logic.drawHero();
            if (hero) {
                alert(`恭喜獲得：[${hero.rarity}] ${hero.name}`);
            } else {
                alert("鑽石不足！");
            }
        });

        // 返回按鈕
        this.add.text(50, 750, "返回選單", { color: '#ffff00' })
            .setInteractive().on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
