/**
 * manu.js
 * 負責主選單介面、資源顯示及關卡進入入口
 */
class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        // --- 1. 背景底色 ---
        this.add.rectangle(225, 400, 450, 800, 0x1a1a1a);

        // --- 2. 頂部資源列 (金幣與鑽石) ---
        // 銅錢區塊
        this.add.rectangle(110, 50, 160, 45, 0x000000, 0.7).setStrokeStyle(2, 0xffcc00);
        this.coinText = this.add.text(125, 50, logic.currency.coins, {
            fontSize: '22px', color: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(50, 50, "🪙", { fontSize: '26px' }).setOrigin(0.5);

        // 鑽石區塊
        this.add.rectangle(340, 50, 160, 45, 0x000000, 0.7).setStrokeStyle(2, 0x00ffff);
        this.diamondText = this.add.text(355, 50, logic.currency.diamonds, {
            fontSize: '22px', color: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(280, 50, "💎", { fontSize: '26px' }).setOrigin(0.5);

        // --- 3. 玩家資訊簡報 (等級與戰力) ---
        this.add.rectangle(225, 160, 390, 100, 0x333333, 0.5).setStrokeStyle(1, 0x888888);
        this.add.text(60, 140, `玩家等級: LV.${logic.playerLevel}`, { fontSize: '20px', color: '#ffffff' });
        this.add.text(60, 175, `基礎攻擊: ${logic.baseAttackPower}`, { fontSize: '18px', color: '#aaaaaa' });

        // --- 4. 遊戲標題 ---
        let title = this.add.text(225, 320, "MERGE\nDUNGEON RUSH", {
            fontSize: '42px', 
            color: '#ffffff', 
            fontStyle: 'bold',
            align: 'center',
            stroke: '#ee7700',
            strokeThickness: 6
        }).setOrigin(0.5);

        // 標題緩動特效
        this.tweens.add({
            targets: title,
            y: 330,
            duration: 2000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // --- 5. 進入關卡按鈕 ---
        let startBtn = this.add.container(225, 550);
        let btnBg = this.add.rectangle(0, 0, 260, 80, 0xee7700).setInteractive({ useHandCursor: true });
        let btnText = this.add.text(0, 0, "進入地下城", { 
            fontSize: '32px', color: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        startBtn.add([btnBg, btnText]);

        // 按鈕互動效果
        btnBg.on('pointerover', () => btnBg.setFillStyle(0xff8822));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0xee7700));
        
        btnBg.on('pointerdown', () => {
            // 點擊縮放動畫
            this.tweens.add({
                targets: startBtn,
                scale: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('GameScene'); // 跳轉到戰鬥場景
                }
            });
        });

        // --- 6. 底部進度提示 ---
        this.add.text(225, 750, `當前探索進度：Level ${logic.currentLevel}`, { 
            fontSize: '18px', color: '#666666' 
        }).setOrigin(0.5);
    }

    /**
     * 當從戰鬥場景勝利返回時，刷新畫面上的數據
     */
    update() {
        this.coinText.setText(logic.currency.coins);
        this.diamondText.setText(logic.currency.diamonds);
    }
}
