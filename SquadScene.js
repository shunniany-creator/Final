class SquadScene extends Phaser.Scene {
    constructor() { super({ key: 'SquadScene' }); }

    create() {
        this.add.rectangle(225, 400, 450, 800, 0x12121a);
        this.add.text(225, 40, "HERO SQUAD", { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // 顯示當前編隊 (5格)
        this.drawSquadSlots();
        // 顯示擁有英雄清單
        this.drawHeroList();

        let backBtn = this.add.text(225, 750, "RETURN", { fontSize: '20px', color: '#888' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    }

    drawSquadSlots() {
        this.add.text(40, 100, "Current Squad:", { fontSize: '18px', color: '#aaa' });
        logic.squad.forEach((hero, i) => {
            const x = 65 + (i * 80);
            const y = 180;
            const slot = this.add.container(x, y);
            
            // 底框
            const bg = this.add.rectangle(0, 0, 70, 90, 0x1f1f2e).setStrokeStyle(2, 0x555566).setInteractive();
            slot.add(bg);

            if (hero) {
                const img = this.add.image(0, 0, 'hero_' + hero.type).setDisplaySize(65, 85);
                slot.add(img);
                // 點擊從編隊移除
                bg.on('pointerdown', () => {
                    logic.squad[i] = null;
                    this.scene.restart();
                });
                this.setupLongPress(bg, hero);
            }
        });
    }

    drawHeroList() {
        this.add.text(40, 260, "Owned Heroes (Click to Assign):", { fontSize: '18px', color: '#aaa' });
        logic.heroes.forEach((hero, i) => {
            const x = 65 + (i % 5 * 80);
            const y = 350 + (Math.floor(i / 5) * 110);
            const container = this.add.container(x, y);
            const bg = this.add.rectangle(0, 0, 70, 90, 0x2a2a3a).setStrokeStyle(1, 0x888).setInteractive();
            const img = this.add.image(0, 0, 'hero_' + hero.type).setDisplaySize(65, 85);
            container.add([bg, img]);

            bg.on('pointerdown', () => {
                const emptyIdx = logic.squad.indexOf(null);
                if (emptyIdx !== -1 && !logic.squad.includes(hero)) {
                    logic.squad[emptyIdx] = hero;
                    this.scene.restart();
                }
            });
            this.setupLongPress(bg, hero);
        });
    }

    setupLongPress(object, hero) {
        let timer;
        object.on('pointerdown', () => {
            timer = this.time.delayedCall(600, () => {
                this.scene.launch('HeroDetailScene', { hero: hero });
            });
        });
        object.on('pointerup', () => { if (timer) timer.remove(); });
        object.on('pointerout', () => { if (timer) timer.remove(); });
    }
}
