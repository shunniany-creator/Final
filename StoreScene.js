/**
 * StoreScene.js
 * 英雄召喚聖殿 - 使用本地 .jpg 資源
 */
class StoreScene extends Phaser.Scene {
    constructor() { super({ key: 'StoreScene' }); }

    preload() {
        // 1. 載入五位英雄的立繪 (.jpg)
        // 請確保路徑與檔案名稱大小寫完全一致
        this.load.image('hero_thunder', 'assets/character/Lyra.jpg');
        this.load.image('hero_light', 'assets/character/Iris.jpg');
        this.load.image('hero_poison', 'assets/character/Vipera.jpg');
        this.load.image('hero_fire', 'assets/character/Hestia.jpg');
        this.load.image('hero_ice', 'assets/character/Elsa.jpg');
    }

    create() {
        // 深色背景與頂部標題
        this.add.rectangle(225, 400, 450, 800, 0x0c0c12);
        this.add.text(225, 50, "SUMMONING SANCTUARY", { 
            fontSize: '24px', color: '#d4af37', fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.drawCurrencyUI();

        // 2. 生成五張英雄卡牌
        const spacing = 86;
        const startX = 45;

        logic.shopHeroes.forEach((hero, i) => {
            const x = startX + (i * spacing);
            this.createCharacterCard(x, 320, hero, i);
        });

        // 3. 底部召喚區域
        this.createSummonButton();

        // 返回選單按鈕
        let backBtn = this.add.text(225, 750, "BACK TO MAIN MENU", { 
            fontSize: '18px', color: '#888888' 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    }

    createCharacterCard(x, y, data, index) {
        const attrColors = {
            thunder: 0xffdb19, light: 0xffffff, poison: 0x39ff14, fire: 0xff4500, ice: 0x00ffff
        };

        const card = this.add.container(x, y);
        
        // 卡牌底座
        const bg = this.add.rectangle(0, 0, 78, 280, 0x1f1f2e).setStrokeStyle(2, 0x444455);
        
        // --- 核心：顯示立繪 ---
        // 這裡使用 preload 時定義的 key: hero_thunder, hero_ice 等
        const portrait = this.add.image(0, -35, 'hero_' + data.type);
        
        // 縮放圖片以適應卡牌 (如果圖片是正方形或長方形，這裡會強制調整)
        portrait.setDisplaySize(70, 110); 

        // 屬性圖騰
        const gem = this.add.circle(0, -110, 12, 0x000000).setStrokeStyle(1, attrColors[data.type]);
        const innerGem = this.add.circle(0, -110, 6, attrColors[data.type]);

        // 名字資訊
        const enName = this.add.text(0, 45, data.name.split(' (')[0], {
            fontSize: '13px', color: attrColors[data.type], fontStyle: 'bold'
        }).setOrigin(0.5);

        const cnName = this.add.text(0, 70, data.name.split('(')[1].replace(')', ''), {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 購買按鈕 (3000 金幣)
        const buyBtnBg = this.add.rectangle(0, 110, 70, 35, 0x3d2b1f).setStrokeStyle(1, 0xd4af37).setInteractive({ useHandCursor: true });
        const buyTxt = this.add.text(0, 110, "3000", { fontSize: '14px', color: '#d4af37' }).setOrigin(0.5);

        card.add([bg, portrait, gem, innerGem, enName, cnName, buyBtnBg, buyTxt]);

        // 點擊事件
        buyBtnBg.on('pointerdown', () => {
            let res = logic.buyHero(index);
            if (res.success) {
                this.cameras.main.flash(300, 212, 175, 55);
                this.updateCurrency();
                alert(`召喚成功：${data.name} 簽訂了靈魂契約！`);
            } else {
                alert("金幣餘額不足以支付報酬。");
            }
        });
    }

    createSummonButton() {
        const btn = this.add.container(225, 620);
        const bg = this.add.rectangle(0, 0, 320, 80, 0x2e1a47).setStrokeStyle(3, 0xa020f0).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, "PREMIUM SUMMON (10💎)", {
            fontSize: '20px', align: 'center', fontStyle: 'bold', color: '#ee82ee'
        }).setOrigin(0.5);
        
        btn.add([bg, txt]);
        bg.on('pointerdown', () => {
            let hero = logic.drawHero();
            if (hero) {
                this.cameras.main.flash(800, 160, 32, 240);
                this.updateCurrency();
                alert(`高級召喚成功：${hero.name} 降臨！`);
            } else {
                alert("鑽石能量不足。");
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
