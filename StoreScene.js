/**
 * StoreScene.js
 * 召喚聖殿：包含金幣購買與鑽石抽卡
 */
class StoreScene extends Phaser.Scene {
    constructor() { super({ key: 'StoreScene' }); }

    preload() {
        // 載入五位英雄的立繪
        this.load.image('hero_thunder', 'assets/character/Lyra.jpg');
        this.load.image('hero_light', 'assets/character/Iris.jpg');
        this.load.image('hero_poison', 'assets/character/Vipera.jpg');
        this.load.image('hero_fire', 'assets/character/Hestia.jpg');
        this.load.image('hero_ice', 'assets/character/Elsa.jpg');
    }

    create() {
        this.add.rectangle(225, 400, 450, 800, 0x0c0c12);
        
        // 標題裝飾
        this.add.text(225, 50, "SUMMONING SANCTUARY", { 
            fontSize: '24px', color: '#d4af37', fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.drawCurrencyUI();

        // 生成英雄卡牌
        const spacing = 86;
        const startX = 45;

        logic.shopHeroes.forEach((hero, i) => {
            const x = startX + (i * spacing);
            this.createCharacterCard(x, 320, hero, i);
        });

        this.createSummonButton();

        // 返回按鈕
        this.add.text(225, 750, "BACK TO MAIN MENU", { fontSize: '18px', color: '#888888' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.scene.start('MainMenu'));
    }

    createCharacterCard(x, y, data, index) {
        const attrColors = {
            thunder: 0xffdb19, light: 0xffffff, poison: 0x39ff14, fire: 0xff4500, ice: 0x00ffff
        };

        const card = this.add.container(x, y);
        
        // 1. 卡牌底座與邊框
        const bg = this.add.rectangle(0, 0, 78, 280, 0x1a1a25).setStrokeStyle(2, 0x444455);
        
        // 2. 角色立繪 (使用你提供的圖片)
        // 根據 type 自動對應 key: 'hero_thunder', 'hero_ice' 等
        const portrait = this.add.image(0, -30, 'hero_' + data.type);
        portrait.setDisplaySize(70, 100); // 調整至適合卡牌的大小
        
        // 3. 屬性核心
        const gem = this.add.circle(0, -110, 12, 0x000000).setStrokeStyle(1, attrColors[data.type]);
        const innerGem = this.add.circle(0, -110, 6, attrColors[data.type]);

        // 4. 文字資訊
        const enName = this.add.text(0, 40, data.name.split(' (')[0], {
            fontSize: '12px', color: attrColors[data.type], fontStyle: 'bold'
        }).setOrigin(0.5);

        const cnName = this.add.text(0, 65, data.name.split('(')[1].replace(')', ''), {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 5. 購買按鈕
        const buyBtnBg = this.add.rectangle(0, 110, 70, 35, 0x3d2b1f).setStrokeStyle(1, 0xd4af37).setInteractive({ useHandCursor: true });
        const buyTxt = this.add.text(0, 110, "3000", { fontSize: '14px', color: '#d4af37' }).setOrigin(0.5);

        card.add([bg, portrait, gem, innerGem, enName, cnName, buyBtnBg, buyTxt]);

        buyBtnBg.on('pointerdown', () => {
            let res = logic.buyHero(index);
            if (res.success) {
                this.cameras.main.flash(300, 212, 175, 55);
                this.updateCurrency();
                alert(`契約達成！${data.name} 加入了冒險。`);
            } else {
                alert("金幣不足。");
            }
        });
    }



    drawCurrencyUI() {
        this.goldText = this.add.text(120, 130, `🪙 GOLD: ${logic.currency.coins}`, { fontSize: '18px', color: '#d4af37' }).setOrigin(0.5);
        this.diaText = this.add.text(320, 130, `💎 GEMS: ${logic.currency.diamonds}`, { fontSize: '18px', color: '#ee82ee' }).setOrigin(0.5);
    }

    updateCurrency() {
        this.goldText.setText(`🪙 GOLD: ${logic.currency.coins}`);
        this.diaText.setText(`💎 GEMS: ${logic.currency.diamonds}`);
    }
}
