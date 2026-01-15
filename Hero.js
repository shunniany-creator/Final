class Hero extends Phaser.Scene {
    constructor() { super({ key: 'HeroDetailScene' }); }
    init(data) { this.hero = data.hero; }

    create() {
        const bg = this.add.rectangle(225, 400, 450, 800, 0x000000, 0.7).setInteractive();
        const panel = this.add.container(225, 400);

        const card = this.add.rectangle(0, 0, 320, 420, 0x222233).setStrokeStyle(4, 0xd4af37);
        const img = this.add.image(-100, -110, 'hero_' + this.hero.type).setDisplaySize(90, 120);
        const nameText = this.add.text(10, -140, this.hero.name, { fontSize: '24px', fontStyle: 'bold', color: '#d4af37' });
        const titleText = this.add.text(10, -100, `[${this.hero.title}]`, { fontSize: '16px', color: '#ffffff' });

        const skillLabel = this.add.text(-140, 20, "SKILL ABILITY", { fontSize: '18px', color: '#00ffff', fontStyle: 'bold' });
        
        const skillData = {
            thunder: "逐雷之痕：消除雷塊時，本回合全隊傷害額外提升 10%。",
            ice: "冰霜女王：消除冰塊可凍結敵人，使其下次攻擊力減半。",
            fire: "紅蓮業火：引發燃燒效果，每回合造成 50% 額外持續傷害。",
            poison: "秘毒魔女：劇毒入體，無視防禦力，每回合累積破防值。",
            light: "聖光祈禱：大幅強化基礎連擊補正，提升 15% 基礎攻擊。"
        };

        const skillDesc = this.add.text(0, 100, skillData[this.hero.type], { 
            fontSize: '17px', color: '#ffffff', wordWrap: { width: 280 }, lineSpacing: 8
        }).setOrigin(0.5);

        const closeHint = this.add.text(0, 180, "Tap anywhere to close", { fontSize: '14px', color: '#888' }).setOrigin(0.5);

        panel.add([card, img, nameText, titleText, skillLabel, skillDesc, closeHint]);
        bg.on('pointerdown', () => this.scene.stop());
    }
}
