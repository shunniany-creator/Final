/**
 * SquadScene.js
 * 負責英雄編隊管理：包含更換出戰成員與查看英雄詳情
 */
class SquadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SquadScene' });
    }

    create() {
        // 1. 背景底色
        this.add.rectangle(225, 400, 450, 800, 0x12121a);
        
        // 標題
        this.add.text(225, 50, "SQUAD MANAGEMENT", { 
            fontSize: '28px', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);

        // 2. 渲染上方：當前出戰編隊 (Active Squad)
        this.drawActiveSquad();

        // 3. 渲染下方：擁有的英雄庫 (Hero Inventory)
        this.drawHeroInventory();

        // 4. 返回按鈕
        const backBtn = this.add.container(225, 740);
        const btnBg = this.add.rectangle(0, 0, 200, 50, 0x333344).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, "SAVE & RETURN", { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        backBtn.add([btnBg, btnText]);

        btnBg.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        // 提示文字
        this.add.text(225, 785, "* Long press hero to view skills", { fontSize: '14px', color: '#666' }).setOrigin(0.5);
    }

    /**
     * 繪製上方 5 個出戰位置
     */
    drawActiveSquad() {
        this.add.text(40, 110, "ACTIVE SQUAD (Tap to remove)", { fontSize: '16px', color: '#ffd700' });

        // 固定顯示 5 個格子
        for (let i = 0; i < 5; i++) {
            const x = 65 + (i * 80);
            const y = 185;
            const hero = logic.squad[i]; // 從 logic 讀取目前編隊狀態

            const container = this.add.container(x, y);
            
            // 格子底框
            const slotBg = this.add.rectangle(0, 0, 70, 95, 0x1f1f2e)
                .setStrokeStyle(2, 0x444455)
                .setInteractive();
            container.add(slotBg);

            if (hero) {
                // 英雄圖片
                const img = this.add.image(0, 0, 'hero_' + hero.type).setDisplaySize(66, 90);
                container.add(img);

                // 點擊移除功能
                slotBg.on('pointerdown', () => {
                    logic.squad[i] = null; // 邏輯層清空
                    this.scene.restart();  // 刷新畫面
                });

                // 長按查看詳情
                this.setupLongPress(slotBg, hero);
            } else {
                // 空位顯示
                container.add(this.add.text(0, 0, "EMPTY", { fontSize: '12px', color: '#444' }).setOrigin(0.5));
            }
        }
    }

    /**
     * 繪製下方玩家擁有的英雄清單
     */
    drawHeroInventory() {
        this.add.text(40, 280, "HERO INVENTORY (Tap to deploy)", { fontSize: '16px', color: '#aaaaaa' });

        logic.heroes.forEach((hero, i) => {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = 65 + (col * 80);
            const y = 360 + (row * 110);

            const container = this.add.container(x, y);
            
            // 英雄底框
            const heroBg = this.add.rectangle(0, 0, 72, 95, 0x2a2a3a)
                .setStrokeStyle(1, 0x888888)
                .setInteractive();
            
            // 英雄圖片
            const img = this.add.image(0, 0, 'hero_' + hero.type).setDisplaySize(68, 91);
            
            // 檢查該英雄是否已在編隊中 (如果在，變暗)
            if (logic.squad.includes(hero)) {
                img.setTint(0x444444);
                this.add.text(x, y + 40, "DEPLOYED", { fontSize: '10px', color: '#ffd700' }).setOrigin(0.5);
            }

            container.add([heroBg, img]);

            // 點擊部署功能
            heroBg.on('pointerdown', () => {
                const emptyIdx = logic.squad.indexOf(null);
                const alreadyIn = logic.squad.includes(hero);

                if (!alreadyIn && emptyIdx !== -1) {
                    logic.squad[emptyIdx] = hero; // 放入第一個空位
                    this.scene.restart();
                } else if (alreadyIn) {
                    // 如果點擊已在陣上的英雄，可以做個小震動提示
                    this.tweens.add({ targets: container, x: x + 5, duration: 50, yoyo: true, repeat: 2 });
                }
            });

            // 長按查看詳情
            this.setupLongPress(heroBg, hero);
        });
    }

    /**
     * 通用長按檢測邏輯
     * @param {Phaser.GameObjects.GameObject} target 監聽對象
     * @param {Object} heroData 英雄資料
     */
    setupLongPress(target, heroData) {
        let timer;
        
        target.on('pointerdown', () => {
            // 600 毫秒判定為長按
            timer = this.time.delayedCall(600, () => {
                // 啟動 Hero.js (Key: HeroDetailScene)
                this.scene.launch('HeroDetailScene', { hero: heroData });
            });
        });

        // 如果手放開、移開、或滾動，取消計時
        target.on('pointerup', () => { if (timer) timer.remove(); });
        target.on('pointerout', () => { if (timer) timer.remove(); });
    }
}
