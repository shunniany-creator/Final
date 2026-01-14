/**
 * GameLogic.js 
 * 負責處理數值計算、盤面邏輯、戰鬥狀態
 */
class GameLogic {
    constructor() {
        // --- 盤面設定 ---
        this.rows = 7;
        this.cols = 7;
        // 類型：0:ICE(冰), 1:FIRE(火), 2:THUNDER(雷), 3:POISON(毒)
        this.types = ['ICE', 'FIRE', 'THUNDER', 'POISON']; 
        this.board = [];

        // --- 玩家數據 (修正黑屏關鍵：新增 currency) ---
        this.currency = {
            coins: 100,
            diamonds: 10
        };
        
        this.playerLevel = 1;
        this.playerEXP = 0;
        this.expToNextLevel = 100;
        
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.baseAttackPower = 15; // 基礎攻擊力

        // --- 關卡與怪物數據 ---
        this.currentLevel = 1;
        this.monsterMaxHP = 1000;
        this.monsterHP = 1000;

        // --- 怪物狀態異常追蹤 ---
        this.monsterStatus = {
            frozen: false,          // 冰：怪物下次傷害減半
            burning: 0,             // 火：燃燒剩餘回合
            burnDamage: 0,          // 火：每回合固定傷害
            damageMultiplier: 1.0,  // 雷：傷害加成倍率
            defenseDown: 0          // 毒：累積破防傷害
        };

        this.initBoard();
    }

    /**
     * 初始化盤面，確保一開始沒有三連
     */
    initBoard() {
        for (let r = 0; r < this.rows; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.cols; c++) {
                let type;
                do {
                    type = Math.floor(Math.random() * this.types.length);
                } while (this.isPreMatch(r, c, type));
                this.board[r][c] = type;
            }
        }
    }

    /**
     * 檢查初始化時是否會自動消除
     */
    isPreMatch(r, c, type) {
        if (c >= 2 && this.board[r][c - 1] === type && this.board[r][c - 2] === type) return true;
        if (r >= 2 && this.board[r - 1][c] === type && this.board[r - 2][c] === type) return true;
        return false;
    }

    /**
     * 檢查整個盤面的匹配 (Match-3)
     */
    checkMatches() {
        let matchedTiles = new Set();
        // 橫向檢查
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols - 2; c++) {
                let t = this.board[r][c];
                if (t !== null && t === this.board[r][c + 1] && t === this.board[r][c + 2]) {
                    matchedTiles.add(`${r},${c}`); 
                    matchedTiles.add(`${r},${c + 1}`); 
                    matchedTiles.add(`${r},${c + 2}`);
                }
            }
        }
        // 縱向檢查
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows - 2; r++) {
                let t = this.board[r][c];
                if (t !== null && t === this.board[r + 1][c] && t === this.board[r + 2][c]) {
                    matchedTiles.add(`${r},${c}`); 
                    matchedTiles.add(`${r + 1},${c}`); 
                    matchedTiles.add(`${r + 2},${c}`);
                }
            }
        }
        return Array.from(matchedTiles).map(s => {
            let [r, c] = s.split(',').map(Number);
            return { r, c, type: this.board[r][c] };
        });
    }

    /**
     * 計算消除後的攻擊效果與狀態變化
     */
    calculateEffect(matches) {
        let stats = { ice: 0, fire: 0, thunder: 0, poison: 0 };
        matches.forEach(m => {
            if (m.type === 0) stats.ice++;
            if (m.type === 1) stats.fire++;
            if (m.type === 2) stats.thunder++;
            if (m.type === 3) stats.poison++;
        });

        // 1. 雷：永久增加當前戰鬥的傷害倍率
        if (stats.thunder > 0) {
            this.monsterStatus.damageMultiplier += (0.05 * stats.thunder);
        }

        // 2. 毒：累積基礎破防傷害
        if (stats.poison > 0) {
            this.monsterStatus.defenseDown += (stats.poison * 3);
        }

        // 3. 計算總傷害 (消除個數 * 基礎攻擊 + 毒素傷害) * 雷電倍率
        let totalBase = matches.length * this.baseAttackPower;
        let finalDamage = Math.floor((totalBase + this.monsterStatus.defenseDown) * this.monsterStatus.damageMultiplier);
        
        this.monsterHP = Math.max(0, this.monsterHP - finalDamage);

        // 4. 冰凍狀態觸發 (怪物傷害減半)
        if (stats.ice > 0) {
            this.monsterStatus.frozen = true;
        }
        
        // 5. 燃燒狀態觸發 (每回合 1/2 的消除傷害)
        if (stats.fire > 0) {
            this.monsterStatus.burning = 3;
            this.monsterStatus.burnDamage = Math.floor(finalDamage / 2);
        }

        return {
            damageDealt: finalDamage,
            hasFrozen: this.monsterStatus.frozen,
            hasBurning: this.monsterStatus.burning > 0,
            currentMultiplier: this.monsterStatus.damageMultiplier
        };
    }

    /**
     * 怪物攻擊邏輯 (根據關卡提升難度)
     */
    monsterAttack() {
        let baseAttack = 15 + (this.currentLevel - 1) * 8; 
        
        // 冰凍效果：怪物攻擊力減半
        if (this.monsterStatus.frozen) {
            baseAttack = Math.floor(baseAttack * 0.5);
        }

        this.playerHP = Math.max(0, this.playerHP - baseAttack);
        return baseAttack;
    }

    /**
     * 每回合結束清算 (處理燃燒與重置冰凍)
     */
    endTurn() {
        // 燃燒結算
        if (this.monsterStatus.burning > 0) {
            this.monsterHP = Math.max(0, this.monsterHP - this.monsterStatus.burnDamage);
            this.monsterStatus.burning--;
        }

        // 冰凍僅持續一回合，怪物攻擊完就重置
        this.monsterStatus.frozen = false;
    }

    /**
     * 玩家經驗值與等級提升
     */
    gainEXP(amount) {
        this.playerEXP += amount;
        let leveledUp = false;
        
        while (this.playerEXP >= this.expToNextLevel) {
            this.playerEXP -= this.expToNextLevel;
            this.playerLevel++;
            leveledUp = true;
            
            // 成長數值
            this.playerMaxHP += 30;
            this.baseAttackPower += 5;
            this.playerHP = this.playerMaxHP;
            this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);
        }
        return leveledUp;
    }

    /**
     * 進入下一關，重置戰場與怪物
     */
    nextLevel() {
        // 1. 獲取獎勵
        let expGained = 50 + (this.currentLevel * 20);
        let leveledUp = this.gainEXP(expGained);
        this.currency.coins += (50 + this.currentLevel * 10); // 獲得金幣

        // 2. 等級提升
        this.currentLevel++;
        
        // 3. 怪物數值成長 (公式可調整)
        this.monsterMaxHP = 1000 + (this.currentLevel - 1) * 600;
        this.monsterHP = this.monsterMaxHP;

        // 4. 重置狀態
        this.monsterStatus = {
            frozen: false,
            burning: 0,
            burnDamage: 0,
            damageMultiplier: 1.0,
            defenseDown: 0
        };

        this.initBoard(); // 刷新盤面
        return { expGained, leveledUp };
    }

    /**
     * 復活玩家
     */
    revivePlayer() {
        this.playerHP = Math.floor(this.playerMaxHP * 0.5);
    }
}
