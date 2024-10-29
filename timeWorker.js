// 移除狀態對象，簡化邏輯
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
        
        // 設置初始時間
        remainingTime = time;
        
        // 開始新的計時器
        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime -= 100;
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
    }
};