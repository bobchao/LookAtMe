let timerInterval;
let remainingTime = 0;

self.onmessage = function(event) {
    const { command, time } = event.data;

    if (command === 'start') {
        remainingTime = time;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime -= 200;
                self.postMessage({ command: 'tick', remainingTime });
            } else {
                clearInterval(timerInterval);
                self.postMessage({ command: 'end' });
            }
        }, 200);
    } else if (command === 'stop') {
        clearInterval(timerInterval);
    }
};