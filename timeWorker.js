let targetEndTime = null;
let timerInterval = null;

self.onmessage = function(event) {
    const { command, time } = event.data;
    
    if (command === 'start') {
        // 清除現有計時器
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // 只記錄目標結束時間
        targetEndTime = Date.now() + time;
        
        // 使用 1 秒的更新頻率
        timerInterval = setInterval(() => {
            const now = Date.now();
            const remainingTime = Math.max(0, targetEndTime - now);

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
        }, 1000);
        
    } else if (command === 'stop') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        targetEndTime = null;
    }
};