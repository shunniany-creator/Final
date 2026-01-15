/**
 * game.js
 * 遊戲啟動點：負責全域初始化、場景配置與系統串接
 */

// 1. 初始化核心邏輯 (包含英雄庫、背包、商店機率等)
// 確保 logic 變數在全域範圍內可被所有場景存取，這是所有數據的中心
const logic = new GameLogic();

const config = {
    type: Phaser.AUTO,
    parent: 'game-container', // 確保掛載在 HTML 的 <div id="game-container"> 上
    width: 450,
    height: 800,
    backgroundColor: '#1a1a1a',

    scale: {
        // FIT 會在保持比例的情況下縮放以適應父容器
        mode: Phaser.Scale.FIT, 
        // 確保在畫布在父容器中水平與垂直置中
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 450,
        height: 800
    },

    /**
     * 註冊所有遊戲場景
     * 這裡的名稱必須與各個 .js 檔案中定義的 class 名稱完全一致
     */
    scene: [
        MainMenu,        // 1. 遊戲入口與主選單
        GameScene,       // 2. 核心三消戰鬥畫面
        StoreScene,      // 3. 英雄抽取與商店系統
        SquadScene,      // 4. 英雄編隊管理
        InventoryScene,  // 5. 背包與道具系統
        Hero             // 6. 英雄詳情彈窗 (由 hero.js 提供)
    ]
};

// 2. 正式啟動 Phaser 遊戲實例
const game = new Phaser.Game(config);

/**
 * 系統啟動後的狀態檢查 (除錯用)
 */
console.log("--- ⚔️ 傳奇英雄三消：系統啟動成功 ⚔️ ---");
console.log(`當前玩家等級: ${logic.playerLevel}`);
console.log(`已持有英雄數: ${logic.heroes.length}`);
console.log(`當前出戰人數: ${logic.squad.filter(h => h !== null).length} / 5`);

/**
 * 除錯小秘技 (開發用):
 * 你可以在瀏覽器控制台 (F12) 直接輸入以下指令測試：
 * logic.currency.gold += 1000;      // 增加金幣
 * logic.currency.diamonds += 100;   // 增加鑽石
 * game.scene.start('StoreScene');   // 強制跳轉場景
 */
