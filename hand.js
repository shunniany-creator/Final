/**
 * Hand.js
 * 處理玩家的手勢操作：拖拽、滑動方向判定、座標同步
 */
class Hand {
    /**
     * @param {Phaser.Scene} scene - 當前的 GameScene
     * @param {GameLogic} logic - 全域邏輯實例
     * @param {number} tileSize - 方塊大小 (60)
     * @param {object} offset - 盤面偏移量 {x, y}
     * @param {Array} sprites - 儲存方塊實體的二維陣列
     * @param {Function} onSwap - 交換成功後的回調函數 (p1, p2) => {}
     */
    constructor(scene, logic, tileSize, offset, sprites, onSwap) {
        this.scene = scene;
        this.logic = logic;
        this.tileSize = tileSize;
        this.offset = offset;
        this.sprites = sprites;
        this.onSwap = onSwap;
        
        this.isAnimating = false; // 動畫中禁止操作
        this.initInput();
    }

    /**
     * 設定操作鎖定狀態
     */
    setAnimating(value) {
        this.isAnimating = value;
    }

    /**
     * 初始化 Phaser 拖拽事件
     */
    initInput() {
        // 開始拖拽
        this.scene.input.on('dragstart', (pointer, gameObject) => {
            if (this.isAnimating) return;
            
            // 提至最上層
            gameObject.setDepth(10);
            // 紀錄起始位置
            gameObject.setData('startX', gameObject.x);
            gameObject.setData('startY', gameObject.y);
        });

        // 拖拽中
        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (this.isAnimating) return;
            
            // 限制拖拽範圍 (只能在周圍移動，增加操作手感)
            let startX = gameObject.getData('startX');
            let startY = gameObject.getData('startY');
            let dist = Phaser.Math.Distance.Between(startX, startY, dragX, dragY);
            
            if (dist < this.tileSize * 1.2) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        // 拖拽結束
        this.scene.input.on('dragend', (pointer, gameObject) => {
            if (this.isAnimating) return;
            
            gameObject.setDepth(1);
            let startX = gameObject.getData('startX');
            let startY = gameObject.getData('startY');
            let pos = gameObject.getData('pos'); // 取得方塊的網格座標 {r, c}

            // 計算滑動方向
            let dx = gameObject.x - startX;
            let dy = gameObject.y - startY;
            
            // 滑動門檻值 (移動超過 20 像素才判定為滑動)
            let threshold = 20;
            let targetPos = null;

            if (Math.abs(dx) > Math.abs(dy)) {
                // 橫向滑動
                if (dx > threshold && pos.c < this.logic.cols - 1) {
                    targetPos = { r: pos.r, c: pos.c + 1 };
                } else if (dx < -threshold && pos.c > 0) {
                    targetPos = { r: pos.r, c: pos.c - 1 };
                }
            } else {
                // 縱向滑動
                if (dy > threshold && pos.r < this.logic.rows - 1) {
                    targetPos = { r: pos.r + 1, c: pos.c };
                } else if (dy < -threshold && pos.r > 0) {
                    targetPos = { r: pos.r - 1, c: pos.c };
                }
            }

            if (targetPos) {
                // 觸發交換邏輯
                this.onSwap(pos, targetPos);
            } else {
                // 無效滑動：彈回原位
                this.scene.tweens.add({
                    targets: gameObject,
                    x: startX,
                    y: startY,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
            }
        });
    }

    /**
     * 更新方塊的原始參考座標 (在掉落或交換動畫完成後呼叫)
     */
    updateOrigin(sprite, x, y) {
        sprite.setData('originX', x);
        sprite.setData('originY', y);
        sprite.x = x;
        sprite.y = y;
    }
}
