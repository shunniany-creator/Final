/**
 * GameScene.js
 * 負責戰鬥畫面渲染、消除動畫、掉落補位與回合清算
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // 載入方塊：0:ICE, 1:FIRE, 2:THUNDER, 3:POISON
        this.load.image('type0', 'assets/ice/item.png');
        this.load.image('type1', 'assets/fire/item.png');
        this.load.image('type2', 'assets/thunder/item.png');
        this.load.image('type3', 'assets/poison/item.png');
        
        // 載入英雄縮圖 (用於戰鬥介面)
        this.load.image('hero_thunder', 'assets/character/Lyra.jpg');
        this.load.image('hero_light', 'assets/character/Iris.jpg');
        this.load.image('hero_poison', 'assets/character/Vipera.jpg');
        this.load.image('hero_fire', 'assets/character/Hestia.jpg');
        this.load.image('hero_ice', 'assets/character/Elsa.jpg');
    }

    create() {
        // --- 1. 基礎設定 ---
        this.sprites = [];
        this.tileSize = 60;
        this.offset = { x: 45, y: 380 }; // 稍微下移，為英雄欄留出空間
        this.isAnimating = false;

        // --- 2. 繪製戰鬥區域 UI ---
        this.add.rectangle(225, 140, 420, 240, 0x333333).setStrokeStyle(2, 0x555555);
        
        this.hpText = this.add.text(50, 40, `BOSS HP: ${logic.monsterHP}`, { 
            fontSize: '28px', color: '#ff4444', fontStyle: 'bold' 
        });
        
        this.playerHPText = this.add.text(50, 80, `PLAYER HP: ${logic.playerHP} / ${logic.playerMaxHP}`, { 
            fontSize: '24px', color: '#44ff44', fontStyle: 'bold' 
        });

        this.statusText = this.add.text(50, 120, `LEVEL: ${logic.currentLevel} | 攻擊力: ${logic.baseAttackPower}`, {
            fontSize: '16px', color: '#ffffff'
        });

        // --- 3. 繪製備戰英雄區 (新增) ---
        this.drawSquadUI();

        // --- 4. 初始化操作組件 (Hand.js) ---
        this.hand = new Hand(this, logic, this.tileSize, this.offset, this.sprites, (p1, p2) => {
            this.swapTiles(p1, p2);
        });

        this.createBoard();
    }

    /**
     * 在戰鬥畫面渲染 5 個英雄縮圖
     */
    drawSquadUI() {
        const startX = 65;
        const y = 230; // 位於資訊與盤面之間
        
        logic.squad.forEach((hero, i) => {
            const x = startX + (i * 80);
            const slot = this.add.container(x, y);
            
            // 縮圖背景框
            const bg = this.add.rectangle(0, 0, 64, 64, 0x000000, 0.5).setStrokeStyle(2, 0x888888).setInteractive();
            slot.add(bg);

            if (hero) {
                const img = this.add.image(0, 0, 'hero_' + hero.type).setDisplaySize(60, 60);
                slot.add(img);
                
                // 長按查看技能
                this.setupLongPress(bg, hero);
            } else {
                slot.add(this.add.text(0, 0, "+", { fontSize: '24px', color: '#444' }).setOrigin(0.5));
            }
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

    createBoard() {
        for (let r = 0; r < logic.rows; r++) {
            this.sprites[r] = [];
            for (let c = 0; c < logic.cols; c++) {
                this.renderTile(r, c);
            }
        }
    }

    renderTile(r, c) {
        let x = this.offset.x + c * this.tileSize;
        let y = this.offset.y + r * this.tileSize;
        let type = logic.board[r][c];
        let sprite = this.add.sprite(x, y, 'type' + type).setInteractive();
        sprite.setDisplaySize(50, 50); 
        sprite.setData('pos', {r, c});
        this.input.setDraggable(sprite); 
        this.sprites[r][c] = sprite;
        return sprite;
    }

    async swapTiles(p1, p2) {
        this.hand.setAnimating(true);
        let temp = logic.board[p1.r][p1.c];
        logic.board[p1.r][p1.c] = logic.board[p2.r][p2.c];
        logic.board[p2.r][p2.c] = temp;

        await this.performSwapAnimation(p1, p2);

        let matches = logic.checkMatches();
        if (matches.length > 0) {
            await this.processMatches(matches);
        } else {
            logic.board[p1.r][p1.c] = logic.board[p2.r][p2.c];
            logic.board[p2.r][p2.c] = temp;
            await this.performSwapAnimation(p1, p2);
        }
        this.hand.setAnimating(false);
    }

    performSwapAnimation(p1, p2) {
        return new Promise(resolve => {
            let s1 = this.sprites[p1.r][p1.c];
            let s2 = this.sprites[p2.r][p2.c];
            let x1 = this.offset.x + p1.c * this.tileSize;
            let y1 = this.offset.y + p1.r * this.tileSize;
            let x2 = this.offset.x + p2.c * this.tileSize;
            let y2 = this.offset.y + p2.r * this.tileSize;

            this.tweens.add({ targets: s1, x: x2, y: y2, duration: 200 });
            this.tweens.add({
                targets: s2, x: x1, y: y1, duration: 200,
                onComplete: () => {
                    this.sprites[p1.r][p1.c] = s2;
                    this.sprites[p2.r][p2.c] = s1;
                    s1.setData('pos', { r: p2.r, c: p2.c });
                    s2.setData('pos', { r: p1.r, c: p1.c });
                    resolve();
                }
            });
        });
    }

    async processMatches(matches) {
        let result = logic.calculateEffect(matches);
        this.hpText.setText(`BOSS HP: ${Math.max(0, logic.monsterHP)}`);
        
        let animations = [];
        matches.forEach(m => {
            let s = this.sprites[m.r][m.c];
            logic.board[m.r][m.c] = null;
            animations.push(new Promise(res => {
                this.tweens.add({
                    targets: s, scale: 0, alpha: 0, duration: 200,
                    onComplete: () => { s.destroy(); res(); }
                });
            }));
        });
        await Promise.all(animations);
        await this.dropAndFill();

        let nextMatches = logic.checkMatches();
        if (nextMatches.length > 0) {
            await this.processMatches(nextMatches);
        } else {
            if (logic.monsterHP <= 0) {
                this.handleVictory();
            } else {
                this.handleMonsterTurn();
            }
        }
    }

    async dropAndFill() {
        let dropTweens = [];
        for (let c = 0; c < logic.cols; c++) {
            let emptySpots = 0;
            for (let r = logic.rows - 1; r >= 0; r--) {
                if (logic.board[r][c] === null) {
                    emptySpots++;
                } else if (emptySpots > 0) {
                    let targetR = r + emptySpots;
                    logic.board[targetR][c] = logic.board[r][c];
                    logic.board[r][c] = null;
                    let sprite = this.sprites[r][c];
                    this.sprites[targetR][c] = sprite;
                    this.sprites[r][c] = null;
                    sprite.setData('pos', { r: targetR, c: c });
                    dropTweens.push(new Promise(res => {
                        this.tweens.add({
                            targets: sprite, y: this.offset.y + targetR * this.tileSize,
                            duration: 300, ease: 'Bounce.easeOut', onComplete: res
                        });
                    }));
                }
            }
            for (let i = 0; i < emptySpots; i++) {
                let type = Math.floor(Math.random() * 4);
                logic.board[i][c] = type;
                let sprite = this.renderTile(i, c);
                sprite.y -= 250;
                dropTweens.push(new Promise(res => {
                    this.tweens.add({
                        targets: sprite, y: this.offset.y + i * this.tileSize,
                        duration: 400, ease: 'Bounce.easeOut', onComplete: res
                    });
                }));
            }
        }
        await Promise.all(dropTweens);
    }

    handleMonsterTurn() {
        let dmg = logic.monsterAttack();
        this.playerHPText.setText(`PLAYER HP: ${logic.playerHP} / ${logic.playerMaxHP}`);
        this.cameras.main.shake(200, 0.01);
        logic.endTurn();
        if (logic.playerHP <= 0) {
            alert("你被擊敗了！");
            this.scene.start('MainMenu'); 
        }
    }

    handleVictory() {
        logic.nextLevel();
        alert(`討伐成功！進入下一關`);
        this.scene.start('MainMenu');
    }
}
