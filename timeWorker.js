// 移除狀態對象，簡化邏輯
let startTime = null;
let targetEndTime = null;
let timerInterval = null;
let remainingTime = 0;

// 訊息處理
self.onmessage = function(event) {
    const { command, time } = event.data;
    
    if (command === 'start') {
        // 清除現有計時器
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // 設置初始時間和目標結束時間
        startTime = Date.now();
        targetEndTime = startTime + time;
        remainingTime = time;
        
        // 開始新的計時器
        timerInterval = setInterval(() => {
            const now = Date.now();
            const actualRemaining = targetEndTime - now;
            
            // 每10秒進行一次時間校正
            if (Math.abs(actualRemaining - remainingTime) > 100) {
                console.log('Time drift detected, correcting...');
                remainingTime = actualRemaining;
            } else {
                remainingTime = Math.max(0, remainingTime - 100);
            }

            if (remainingTime > 0) {
                self.postMessage({ 
                    command: 'tick', 
                    remainingTime: remainingTime 
                });
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                self.postMessage({ command: 'end' });
            }
        }, 100);
        
    } else if (command === 'stop') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        startTime = null;
        targetEndTime = null;
    }
};