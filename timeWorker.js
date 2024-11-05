let targetEndTime = null;
let updateInterval = null;
let backgroundTimeout = null;
let isInBackground = false;

// 處理前景更新
function handleForegroundUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        sendTimeUpdate();
    }, 1000);
}

// 處理背景更新
function handleBackgroundUpdate() {
    // 清除前景的 interval
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    const now = Date.now();
    const remainingTime = targetEndTime - now;
    
    if (remainingTime > 0) {
        // 設置一次性 timeout 到結束時間
        backgroundTimeout = setTimeout(() => {
            sendTimeUpdate();
            self.postMessage({ command: 'end' });
        }, remainingTime);
    }
}

// 發送時間更新
function sendTimeUpdate() {
    if (!targetEndTime) return;
    
    const now = Date.now();
    const remainingTime = Math.max(0, targetEndTime - now);
    
    if (remainingTime > 0) {
        self.postMessage({ 
            command: 'tick', 
            remainingTime: remainingTime 
        });
    } else {
        // 清理所有計時器
        cleanup();
        self.postMessage({ command: 'end' });
    }
}

// 清理函數
function cleanup() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    if (backgroundTimeout) {
        clearTimeout(backgroundTimeout);
        backgroundTimeout = null;
    }
}

self.onmessage = function(event) {
    const { command, time, isBackground } = event.data;
    
    switch (command) {
        case 'start':
            cleanup();
            targetEndTime = Date.now() + time;
            isInBackground = isBackground;
            
            if (isBackground) {
                handleBackgroundUpdate();
            } else {
                handleForegroundUpdate();
            }
            // 立即發送第一次更新
            sendTimeUpdate();
            break;
            
        case 'stop':
            cleanup();
            targetEndTime = null;
            break;
            
        case 'visibility-change':
            isInBackground = isBackground;
            if (targetEndTime) {
                if (isBackground) {
                    handleBackgroundUpdate();
                } else {
                    handleForegroundUpdate();
                }
                // 切換時立即更新一次
                sendTimeUpdate();
            }
            break;
    }
};