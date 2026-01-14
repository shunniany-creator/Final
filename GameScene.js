/**
 * GameScene.js
 * 負責戰鬥畫面渲染、消除動畫、掉落補位與回合清算
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * 載入資源 (請確保路徑與 D:\final\assets 一致)
     */
    preload() {
        // 載入方塊：0:ICE, 1:FIRE, 2:THUNDER, 3:POISON
        this.load.image('type0', 'assets/ice/item.png');
        this.load.image('type1', 'assets/fire/item.png');
        this.load.image('type2', 'assets/thunder/item.png');
        this.load.image('type3', 'assets/poison/item.png');
        
        // 如果有背景圖或 Boss 圖可以在此載入
        // this.load.image('background', 'assets/bg.png');
    }

    create() {
        // --- 1. 基礎設定 ---
        this.sprites = [];
        this.tileSize = 60;
        this.offset = { x: 45, y: 350 };
        this.isAnimating = false;

        // --- 2. 繪製戰鬥區域 UI ---
        // 背景裝飾矩形
        this.add.rectangle(225, 160, 420, 280, 0x333333).setStrokeStyle(2, 0x555555);
        
        // Boss 資訊
        this.hpText = this.add.text(50, 40, `BOSS HP: ${logic.monsterHP}`, { 
            fontSize: '28px', color: '#ff4444', fontStyle: 'bold' 
        });
        
        // 玩家資訊
        this.playerHPText = this.add.text(50, 80, `PLAYER HP: ${logic.playerHP} / ${logic.playerMaxHP}`, { 
            fontSize: '24px', color: '#44ff44', fontStyle: 'bold' 
        });

        // 狀態文字
        this.statusText = this.add.text(50, 130, `LEVEL: ${logic.currentLevel} | 攻擊力: ${logic.baseAttackPower}`, {
            fontSize: '16px', color: '#ffffff'
        });

        // --- 3. 初始化操作組件 (Hand.js) ---
        // 傳入 swapTiles 作為回調，當 hand.js 判定滑動成功時觸發此函式
        this.hand = new Hand(this, logic, this.tileSize, this.offset, this.sprites, (p1, p2) => {
            this.swapTiles(p1, p2);
        });

        // 建立初始盤面
        this.createBoard();
    }

    /**
     * 建立方塊盤面
     */
    createBoard() {
        for (let r = 0; r < logic.rows; r++) {
            this.sprites[r] = [];
            for (let c = 0; c < logic.cols; c++) {
                this.renderTile(r, c);
            }
        }
    }

    /**
     * 渲染單個方塊
     */
    renderTile(r, c) {
        let x = this.offset.x + c * this.tileSize;
        let y = this.offset.y + r * this.tileSize;
        let type = logic.board[r][c];
        
        let sprite = this.add.sprite(x, y, 'type' + type).setInteractive();
        sprite.setDisplaySize(50, 50); 
        sprite.setData('pos', {r, c});
        
        // 啟動拖拽功能
        this.input.setDraggable(sprite); 
        this.sprites[r][c] = sprite;
        return sprite;
    }

    /**
     * 執行交換動畫與匹配檢查
     */
    async swapTiles(p1, p2) {
        this.hand.setAnimating(true);

        // 1. 邏輯層交換
        let temp = logic.board[p1.r][p1.c];
        logic.board[p1.r][p1.c] = logic.board[p2.r][p2.c];
        logic.board[p2.r][p2.c] = temp;

        // 2. 演出交換動畫
        await this.performSwapAnimation(p1, p2);

        // 3. 檢查是否有匹配
        let matches = logic.checkMatches();
        if (matches.length > 0) {
            // 進入消除循環
            await this.processMatches(matches);
        } else {
            // 無消除則邏輯換回來，並演出換回來的動畫
            logic.board[p1.r][p1.c] = logic.board[p2.r][p2.c];
            logic.board[p2.r][p2.c] = temp;
            await this.performSwapAnimation(p1, p2);
        }

        this.hand.setAnimating(false);
    }

    /**
     * 兩個方塊互換的補間動畫
     */
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
                    // 同步視圖層陣列
                    this.sprites[p1.r][p1.c] = s2;
                    this.sprites[p2.r][p2.c] = s1;
                    // 更新方塊內存的網格座標
                    s1.setData('pos', { r: p2.r, c: p2.c });
                    s2.setData('pos', { r: p1.r, c: p1.c });
                    resolve();
                }
            });
        });
    }

    /**
     * 處理消除、計算傷害、並啟動連擊檢查
     */
    async processMatches(matches) {
        // 呼叫邏輯層計算屬性傷害與狀態
        let result = logic.calculateEffect(matches);
        
        // 更新 UI 數據
        this.hpText.setText(`BOSS HP: ${Math.max(0, logic.monsterHP)}`);
        
        // 執行消除縮小動畫
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

        // 執行掉落與填充
        await this.dropAndFill();

        // 遞迴檢查連擊 (Combo)
        let nextMatches = logic.checkMatches();
        if (nextMatches.length > 0) {
            await this.processMatches(nextMatches);
        } else {
            // 回合正式結束：判斷勝負或切換到怪物回合
            if (logic.monsterHP <= 0) {
                this.handleVictory();
            } else {
                this.handleMonsterTurn();
            }
        }
    }

    /**
     * 掉落與新方塊補充邏輯
     */
    async dropAndFill() {
        let dropTweens = [];
        for (let c = 0; c < logic.cols; c++) {
            let emptySpots = 0;
            // 由下往上掃描，處理現有方塊下落
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
                            targets: sprite,
                            y: this.offset.y + targetR * this.tileSize,
                            duration: 300, ease: 'Bounce.easeOut',
                            onComplete: res
                        });
                    }));
                }
            }
            // 補充最上方的新方塊
            for (let i = 0; i < emptySpots; i++) {
                let type = Math.floor(Math.random() * 4);
                logic.board[i][c] = type;
                let sprite = this.renderTile(i, c);
                sprite.y -= 250; // 先放在畫布外
                dropTweens.push(new Promise(res => {
                    this.tweens.add({
                        targets: sprite,
                        y: this.offset.y + i * this.tileSize,
                        duration: 400, ease: 'Bounce.easeOut',
                        onComplete: res
                    });
                }));
            }
        }
        await Promise.all(dropTweens);
    }

    /**
     * 怪物回合：執行攻擊與震動特效
     */
    handleMonsterTurn() {
        let dmg = logic.monsterAttack();
        this.playerHPText.setText(`PLAYER HP: ${logic.playerHP} / ${logic.playerMaxHP}`);
        
        // 畫面震動效果增加打擊感
        this.cameras.main.shake(200, 0.01);
        
        logic.endTurn();

        if (logic.playerHP <= 0) {
            alert("你被擊敗了！挑戰結束。");
            // 重新整理頁面或回到主選單
            this.scene.start('MainMenu'); 
        }
    }

    /**
     * 勝利處理：結算數據並回到主選單
     */
    handleVictory() {
        logic.nextLevel();
        alert(`討伐成功！進入下一關：Level ${logic.currentLevel}`);
        // 回到 MainMenu 更新金幣顯示
        this.scene.start('MainMenu');
    }
}
