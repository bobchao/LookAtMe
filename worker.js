self.onmessage = function(e) {
    const duration = e.data; // 接收計時長度
    let remainingTime = duration;

    const interval = setInterval(() => {
        remainingTime -= 1000; // 每秒減少
        self.postMessage(remainingTime); // 發送剩餘時間
        if (remainingTime <= 0) {
            clearInterval(interval);
            self.postMessage(0); // 通知計時結束
        }
    }, 1000);
};
