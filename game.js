/**
 * game.js
 * 遊戲啟動點：負責全域初始化、場景配置與系統串接
 */

// 1. 初始化核心邏輯 (包含英雄庫、背包、商店機率等)
// 確保 logic 變數在全域範圍內可被所有場景存取
const logic = new GameLogic();

const config = {
    type: Phaser.AUTO,
    parent: 'game-container', // 確保掛載在正確的 div 上
    width: 450,
    height: 800,
    backgroundColor: '#1a1a1a',

    scale: {
        // FIT 會在保持比例的情況下縮放以適應父容器
        mode: Phaser.Scale.FIT, 
        // 確保在父容器中水平與垂直置中
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // 這行很重要：強制使用我們定義的寬高
        width: 450,
        height: 800
    },

    /**
     * 註冊所有遊戲場景
     * 順序說明：
     * 1. MainMenu: 遊戲入口、顯示等級與金幣
     * 2. GameScene: 核心三消戰鬥
     * 3. StoreScene: 購買英雄與抽卡系統
     * 4. SquadScene: 英雄編隊與備戰（依等級開放格位）
     * 5. InventoryScene: 背包系統，查看擁有的道具與英雄詳情
     */
    scene: [
        MainMenu, 
        GameScene, 
        StoreScene, 
        SquadScene, 
        InventoryScene
    ]
};

// 2. 正式啟動遊戲實例
const game = new Phaser.Game(config);

/**
 * 除錯助手
 * 你可以在 Chrome 控制台輸入 `logic.currency.diamonds += 1000` 來測試抽卡
 */
console.log("--- 遊戲系統啟動成功 ---");
console.log(`當前玩家等級: ${logic.playerLevel}`);
console.log(`已解鎖英雄數: ${logic.heroes.length}`);
console.log(`當前出戰人數: ${logic.team.length} / ${Math.min(5, 1 + Math.floor(logic.playerLevel / 3))}`);

