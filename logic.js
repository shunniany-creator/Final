]/**
 * logic.js 
 * 負責處理數值計算、盤面邏輯、戰鬥狀態與英雄系統
 */
class GameLogic {
    constructor() {
        // --- 1. 盤面設定 ---
        this.rows = 7;
        this.cols = 7;
        // 類型：0:ICE(冰), 1:FIRE(火), 2:THUNDER(雷), 3:POISON(毒)
        this.types = ['ICE', 'FIRE', 'THUNDER', 'POISON']; 
        this.board = [];

        // --- 2. 玩家貨幣與進度 ---
        this.currency = {
            coins: 10000,   // 初始給多一點方便測試商店
            diamonds: 50
        };
        
        this.playerLevel = 1;
        this.playerEXP = 0;
        this.expToNextLevel = 100;
        
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.baseAttackPower = 15; // 基礎攻擊力

        // --- 3. 英雄系統 (西方角色設定) ---
        this.heroes = []; // 玩家已擁有的英雄實例
        this.squad = [null, null, null, null, null]; // 出戰編隊格位

        // 商店英雄清單 (對應你的 jpg 檔案)
        this.shopHeroes = [
            { name: "Lyra (萊拉)", type: 'thunder', price: 3000, atk: 45, title: "逐雷之痕" },
            { name: "Iris (艾莉絲)", type: 'light', price: 3000, atk: 42, title: "聖光祈禱" },
            { name: "Vipera (薇貝拉)", type: 'poison', price: 3000, atk: 48, title: "秘毒魔女" },
            { name: "Hestia (赫斯緹雅)", type: 'fire', price: 3000, atk: 50, title: "紅蓮業火" },
            { name: "Elsa (艾莎)", type: 'ice', price: 3000, atk: 46, title: "冰霜女王" }
        ];

        // --- 4. 關卡與怪物數據 ---
        this.currentLevel = 1;
        this.monsterMaxHP = 1000;
        this.monsterHP = 1000;

        // --- 5. 怪物狀態異常追蹤 ---
        this.monsterStatus = {
            frozen: false,          // 冰：怪物下次傷害減半
            burning: 0,             // 火：燃燒剩餘回合
            burnDamage: 0,          // 火：每回合固定傷害
            damageMultiplier: 1.0,  // 雷：傷害加成倍率
            defenseDown: 0          // 毒：累積破防傷害
        };

        this.initBoard();
    }

    // ================= 商店與英雄邏輯 =================

    /**
     * 購買英雄
     * @param {number} index - shopHeroes 的索引
     */
    buyHero(index) {
        const heroData = this.shopHeroes[index];
        if (this.currency.coins >= heroData.price) {
            this.currency.coins -= heroData.price;
            
            const newHero = {
                id: Date.now() + index,
                name: heroData.name,
                type: heroData.type,
                atk: heroData.atk,
                lv: 1,
                title: heroData.title
            };
            
            this.heroes.push(newHero);
            
            // 如果出戰欄位有空位，自動放入
            const emptyIdx = this.squad.indexOf(null);
            if (emptyIdx !== -1) {
                this.squad[emptyIdx] = newHero;
            }

            return { success: true, hero: newHero };
        }
        return { success: false, msg: "金幣不足！" };
    }

    /**
     * 鑽石抽卡
     */
    drawHero() {
        if (this.currency.diamonds >= 10) {
            this.currency.diamonds -= 10;
            const randomIndex = Math.floor(Math.random() * this.shopHeroes.length);
            return this.buyHero(randomIndex);
        }
        return { success: false };
    }

    // ================= 盤面邏輯 =================

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

    isPreMatch(r, c, type) {
        if (c >= 2 && this.board[r][c - 1] === type && this.board[r][c - 2] === type) return true;
        if (r >= 2 && this.board[r - 1][c] === type && this.board[r - 2][c] === type) return true;
        return false;
    }

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

    // ================= 戰鬥計算邏輯 =================

    calculateEffect(matches) {
        let stats = { ice: 0, fire: 0, thunder: 0, poison: 0 };
        matches.forEach(m => {
            if (m.type === 0) stats.ice++;
            if (m.type === 1) stats.fire++;
            if (m.type === 2) stats.thunder++;
            if (m.type === 3) stats.poison++;
        });

        // 英雄攻擊加成 (若 squad 中有對應屬性的英雄)
        let squadBonus = 0;
        this.squad.forEach(hero => {
            if (hero) {
                if (hero.type === 'thunder' && stats.thunder > 0) squadBonus += hero.atk;
                if (hero.type === 'ice' && stats.ice > 0) squadBonus += hero.atk;
                if (hero.type === 'fire' && stats.fire > 0) squadBonus += hero.atk;
                if (hero.type === 'poison' && stats.poison > 0) squadBonus += hero.atk;
            }
        });

        // 1. 雷：倍率成長
        if (stats.thunder > 0) this.monsterStatus.damageMultiplier += (0.05 * stats.thunder);
        // 2. 毒：破防傷害
        if (stats.poison > 0) this.monsterStatus.defenseDown += (stats.poison * 3);

        // 3. 計算總傷
        let totalBase = (matches.length * this.baseAttackPower) + squadBonus;
        let finalDamage = Math.floor((totalBase + this.monsterStatus.defenseDown) * this.monsterStatus.damageMultiplier);
        
        this.monsterHP = Math.max(0, this.monsterHP - finalDamage);

        // 4. 觸發冰與火狀態
        if (stats.ice > 0) this.monsterStatus.frozen = true;
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

    monsterAttack() {
        let baseAttack = 15 + (this.currentLevel - 1) * 8; 
        if (this.monsterStatus.frozen) baseAttack = Math.floor(baseAttack * 0.5);
        this.playerHP = Math.max(0, this.playerHP - baseAttack);
        return baseAttack;
    }

    endTurn() {
        if (this.monsterStatus.burning > 0) {
            this.monsterHP = Math.max(0, this.monsterHP - this.monsterStatus.burnDamage);
            this.monsterStatus.burning--;
        }
        this.monsterStatus.frozen = false;
    }

    gainEXP(amount) {
        this.playerEXP += amount;
        let leveledUp = false;
        while (this.playerEXP >= this.expToNextLevel) {
            this.playerEXP -= this.expToNextLevel;
            this.playerLevel++;
            leveledUp = true;
            this.playerMaxHP += 30;
            this.baseAttackPower += 5;
            this.playerHP = this.playerMaxHP;
            this.expToNextLevel = Math.floor(this.expToNextLevel * 1.25);
        }
        return leveledUp;
    }

    nextLevel() {
        let expGained = 50 + (this.currentLevel * 20);
        let leveledUp = this.gainEXP(expGained);
        this.currency.coins += (50 + this.currentLevel * 10);
        this.currentLevel++;
        this.monsterMaxHP = 1000 + (this.currentLevel - 1) * 600;
        this.monsterHP = this.monsterMaxHP;
        this.monsterStatus = { frozen: false, burning: 0, burnDamage: 0, damageMultiplier: 1.0, defenseDown: 0 };
        this.initBoard();
        return { expGained, leveledUp };
    }

    revivePlayer() {
        this.playerHP = Math.floor(this.playerMaxHP * 0.5);
    }
}

// 實例化邏輯
const logic = new GameLogic();
