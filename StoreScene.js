/**
 * StoreScene.js
 * 召喚聖殿：包含金幣購買與鑽石抽卡
 */
class StoreScene extends Phaser.Scene {
    constructor() { super({ key: 'StoreScene' }); }

    create() {
        // 1. 神殿底色背景
        this.add.rectangle(225, 400, 450, 800, 0x0c0c12);
        
        // 繪製頂部裝飾標題框
        const header = this.add.graphics();
        header.fillStyle(0x221a0f, 1);
        header.fillRoundedRect(50, 20, 350, 60, 10);
        header.lineStyle(2, 0xd4af37, 1);
        header.strokeRoundedRect(50, 20, 350, 60, 10);

        this.add.text(225, 50, "SUMMONING SANCTUARY", { 
            fontSize: '24px', color: '#d4af37', fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.drawCurrencyUI();

        // 2. 自動生成五張英雄卡牌
        const cardWidth = 80;
        const spacing = 86; // 間距調整以確保五張卡在 450px 寬度內對齊
        const startX = 45;

        logic.shopHeroes.forEach((hero, i) => {
            const x = startX + (i * spacing);
            this.createCharacterCard(x, 320, hero, i);
        });

        // 3. 底部鑽石高級召喚
        this.createSummonButton();

        // 4. 返回導覽
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
        
        // 頂部屬性核心 (寶石感)
        const gem = this.add.circle(0, -110, 12, 0x000000).setStrokeStyle(1, attrColors[data.type]);
        const innerGem = this.add.circle(0, -110, 6, attrColors[data.type]);

        // 角色英文名字
        const enName = this.add.text(0, -50, data.name.split(' (')[0], {
            fontSize: '14px', color: attrColors[data.type], fontStyle: 'bold'
        }).setOrigin(0.5);

        // 角色中文名稱
        const cnName = this.add.text(0, 0, data.name.split('(')[1].replace(')', ''), {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 角色封號
        const title = this.add.text(0, 30, data.title, {
            fontSize: '11px', color: '#888888'
        }).setOrigin(0.5);

        // 購買按鈕 (金幣)
        const buyBtnBg = this.add.rectangle(0, 100, 70, 35, 0x3d2b1f).setStrokeStyle(1, 0xd4af37).setInteractive({ useHandCursor: true });
        const buyTxt = this.add.text(0, 100, "3000", { fontSize: '14px', color: '#d4af37' }).setOrigin(0.5);

        card.add([bg, gem, innerGem, enName, cnName, title, buyBtnBg, buyTxt]);

        // 點擊購買邏輯
        buyBtnBg.on('pointerdown', () => {
            let res = logic.buyHero(index); // 需確保 logic.js 有實作 buyHero
            if (res.success) {
                this.cameras.main.flash(300, 212, 175, 55); // 金色閃爍
                this.updateCurrency();
                alert(`契約達成！${data.name} 已加入你的軍隊。`);
            } else {
                alert("金幣不足。");
            }
        });
    }

    createSummonButton() {
        const btn = this.add.container(225, 620);
        const bg = this.add.rectangle(0, 0, 320, 80, 0x2e1a47).setStrokeStyle(3, 0xa020f0).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, "PREMIUM SUMMON\n(10 DIAMONDS)", {
            fontSize: '20px', align: 'center', fontStyle: 'bold', color: '#ee82ee'
        }).setOrigin(0.5);
        
        btn.add([bg, txt]);
        bg.on('pointerdown', () => {
            let hero = logic.drawHero(); // 需確保 logic.js 有實作 drawHero
            if (hero) {
                this.cameras.main.flash(800, 160, 32, 240); // 紫色閃爍
                this.updateCurrency();
                alert(`法陣光芒閃耀！你召喚了：${hero.name}`);
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
