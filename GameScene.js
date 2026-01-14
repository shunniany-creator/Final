/**
 * GameScene.js
 * 負責戰鬥畫面渲染、消除動畫、掉落補位
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // --- 1. 基礎設定 ---
        this.sprites = [];
        this.tileSize = 60;
        this.offset = { x: 45, y: 350 };
        this.isAnimating = false;

        // --- 2. 背景與 UI ---
        this.add.rectangle(225, 160, 420, 280, 0x333333).setStrokeStyle(2, 0x555555);
        
        this.hpText = this.add.text(50, 40, `BOSS HP: ${logic.monsterHP}`, { 
            fontSize: '28px', color: '#ff4444', fontStyle: 'bold' 
        });
        
        this.playerHPText = this.add.text(50, 80, `PLAYER HP: ${logic.playerHP} / ${logic.playerMaxHP}`, { 
            fontSize: '24px', color: '#44ff44', fontStyle: 'bold' 
        });

        this.statusText = this.add.text(50, 130, `LEVEL: ${logic.currentLevel} | 攻擊力: ${logic.baseAttackPower}`, {
            fontSize: '16px', color: '#ffffff'
        });

        // --- 3. 初始化操作管家 ---
        // 傳入 swapTiles 作為回調，當 hand.js 判定滑動成功時觸發
        this.hand = new Hand(this, logic, this.tileSize, this.offset, this.sprites, (p1, p2) => {
            this.swapTiles(p1, p2);
        });

        this.createBoard();
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

        // 邏輯層交換
        let temp = logic.board[p1.r][p1.c];
        logic.board[p1.r][p1.c] = logic.board[p2.r][p2.c];
        logic.board[p2.r][p2.c] = temp;

        await this.performSwapAnimation(p1, p2);

        let matches = logic.checkMatches();
        if (matches.length > 0) {
            await this.processMatches(matches);
        } else {
            // 無消除則換回來
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
        
        // 更新 UI
        this.hpText.setText(`BOSS HP: ${Math.max(0, logic.monsterHP)}`);
        
        // 消除動畫
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

        // 遞迴檢查連擊 (Combo)
        let nextMatches = logic.checkMatches();
        if (nextMatches.length > 0) {
            await this.processMatches(nextMatches);
        } else {
            // 回合結束：怪物攻擊或勝利
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
                    // 方塊下落
                    let targetR = r + emptySpots;
                    logic.board[targetR][c] = logic.board[r][c];
                    logic.board[r][c] = null;
                    let sprite = this.sprites[r][c];
                    this.sprites[targetR][c] = sprite;
                    this.sprites[r][c] = null;
                    sprite.setData('pos', { r: targetR, c: c });

                    dropTweens.push(new Promise(res => {
                        this.tweens.add({
                            targets: sprite,
                            y: this.offset.y + targetR * this.tileSize,
                            duration: 300, ease: 'Bounce.easeOut',
                            onComplete: res
                        });
                    }));
                }
            }
            // 補充新方塊
            for (let i = 0; i < emptySpots; i++) {
                let type = Math.floor(Math.random() * 4);
                logic.board[i][c] = type;
                let sprite = this.renderTile(i, c);
                sprite.y -= 200; // 從上方掉入
                dropTweens.push(new Promise(res => {
                    this.tweens.add({
                        targets: sprite,
                        y: this.offset.y + i * this.tileSize,
                        duration: 300, ease: 'Bounce.easeOut',
                        onComplete: res
                    });
                }));
            }
        }
        await Promise.all(dropTweens);
    }

    handleMonsterTurn() {
        logic.monsterAttack();
        this.playerHPText.setText(`PLAYER HP: ${logic.playerHP} / ${logic.playerMaxHP}`);
        this.cameras.main.shake(200, 0.01);
        
        logic.endTurn();
        if (logic.playerHP <= 0) {
            alert("戰敗！進度將被重置。");
            location.reload(); 
        }
    }

    handleVictory() {
        let res = logic.nextLevel();
        alert(`勝利！獲得經驗值，進入 Level ${logic.currentLevel}`);
        // 回到主選單更新金幣數字
        this.scene.start('MainMenu');
    }
}
