/**
 * game.js
 * 遊戲啟動點：負責全域初始化與場景配置
 */

// 1. 在最外層實例化 GameLogic，確保所有場景都能透過 logic 變數共享數據
// 這解決了你之前提到的「黑屏」問題，因為數據在場景啟動前就準備好了
const logic = new GameLogic();

const config = {
    type: Phaser.AUTO,
    width: 450,       // 手機直向比例
    height: 800,
    backgroundColor: '#1a1a1a',
    parent: 'game-container',
    
    // 螢幕自適應設定
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    // 實體引擎設定 (如果之後需要物理效果可開啟)
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    /**
     * 場景清單
     * 放在陣列第一個的場景 (MainMenu) 會被優先執行
     */
    scene: [MainMenu, GameScene]
};

// 2. 初始化遊戲
const game = new Phaser.Game(config);

/**
 * 除錯小技巧 (Debug Helper)
 * 你可以在瀏覽器控制台輸入 logic，查看當前所有數值
 */
console.log("遊戲初始化完成，當前關卡：", logic.currentLevel);
