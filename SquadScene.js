class SquadScene extends Phaser.Scene {
    constructor() { super({ key: 'SquadScene' }); }

    create() {
        this.add.text(225, 50, "英雄編隊", { fontSize: '32px' }).setOrigin(0.5);
        
        // 計算最大出戰人數：1 + Math.floor(Level / 3)
        let maxSlots = Math.min(5, 1 + Math.floor(logic.playerLevel / 3));
        this.add.text(225, 100, `當前最大出戰數：${maxSlots}`, { color: '#aaa' }).setOrigin(0.5);

        // 顯示當前隊伍
        logic.heroes.forEach((hero, index) => {
            let isEquipped = logic.team.includes(hero.id);
            let color = isEquipped ? 0x00ff00 : 0x555555;
            
            let bar = this.add.rectangle(225, 200 + (index * 60), 350, 50, color).setInteractive();
            this.add.text(60, 200 + (index * 60), `${hero.name} (ATK:${hero.atk})`).setOrigin(0, 0.5);

            bar.on('pointerdown', () => {
                if (isEquipped) {
                    logic.team = logic.team.filter(id => id !== hero.id);
                } else {
                    if (logic.team.length < maxSlots) {
                        logic.team.push(hero.id);
                    } else {
                        alert("隊伍已滿！提升等級可增加上限。");
                    }
                }
                this.scene.restart();
            });
        });

        this.add.text(50, 750, "確認返回", { color: '#ffff00' })
            .setInteractive().on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
