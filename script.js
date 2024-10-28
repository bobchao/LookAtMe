document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        svg: document.querySelector('.timer'),
        progressPath: document.querySelector('.timer-progress'),
        handle: document.querySelector('.timer-handle'),
        display: document.querySelector('.timer-display'),
        settingsIcon: document.querySelector('.settings-icon'),
        settingsPanel: document.querySelector('.settings-panel'),
        closeSettings: document.querySelector('.close-settings'),
        darkModeToggle: document.getElementById('darkMode'),
        circleColorInput: document.getElementById('circleColor'),
        muteSoundToggle: document.getElementById('muteSound'),
        alwaysShowTimeToggle: document.getElementById('alwaysShowTime'),
        timerSound: document.getElementById('timerSound'),
        showShortcutsToggle: document.getElementById('showShortcuts'),
        shortbreakIcon: document.querySelector('.shortbreak-icon'),
        longbreakIcon: document.querySelector('.longbreak-icon'),
        workIcon: document.querySelector('.work-icon')
    };

    const state = {
        isDragging: false,
        totalTime: 0,
        remainingTime: 0,
        timerInterval: null,
        startAngle: 0
    };

    const settings = {
        defaultSettings: {
            darkMode: false,
            circleColor: '#4CAF50',
            muteSound: false,
            alwaysShowTime: false,
            showShortcuts: false
        },
        load() {
            if (!localStorage.getItem('timerSettings')) {
                localStorage.setItem('timerSettings', JSON.stringify(this.defaultSettings));
            }
            const savedSettings = JSON.parse(localStorage.getItem('timerSettings'));
            this.applySettings(savedSettings);
        },
        save() {
            const currentSettings = {
                darkMode: elements.darkModeToggle.classList.contains('active'),
                circleColor: elements.circleColorInput.value,
                muteSound: elements.muteSoundToggle.classList.contains('active'),
                alwaysShowTime: elements.alwaysShowTimeToggle.classList.contains('active'),
                showShortcuts: elements.showShortcutsToggle.classList.contains('active')
            };
            localStorage.setItem('timerSettings', JSON.stringify(currentSettings));
            updateHandleColor(currentSettings.circleColor);
        },
        applySettings(settings) {
            if (settings.darkMode) {
                document.body.classList.add('dark-mode');
                elements.darkModeToggle.classList.add('active');
            }
            if (settings.muteSound) {
                elements.muteSoundToggle.classList.add('active');
            }
            if (settings.alwaysShowTime) {
                elements.alwaysShowTimeToggle.classList.add('active');
            }
            if (settings.showShortcuts) {
                elements.showShortcutsToggle.classList.add('active');
                document.body.classList.add('shortcuts-visible');
            }
            elements.progressPath.style.fill = settings.circleColor;
            elements.circleColorInput.value = settings.circleColor;
            updateHandleColor(settings.circleColor);
            updateButtonColors(settings.circleColor);
            updateTimeDisplay();
        }
    };

    function updateHandleColor(color) {
        const rgb = hexToRgb(color);
        const darkerColor = `rgb(${rgb.r * 0.8}, ${rgb.g * 0.8}, ${rgb.b * 0.8})`;
        elements.handle.style.stroke = darkerColor;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function calculateRelativeLuminance(color) {
        const rgb = hexToRgb(color);
        return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    }

    function calculateContrast(color1, color2) {
        const l1 = calculateRelativeLuminance(color1);
        const l2 = calculateRelativeLuminance(color2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    function getActiveColor(selectedColor, isDarkMode) {
        const whiteContrast = calculateContrast(selectedColor, '#FFFFFF');
        const darkContrast = calculateContrast(selectedColor, '#444444');

        if (isDarkMode) {
            if (whiteContrast < 1.5) return '#EDEEB9';
            if (darkContrast < 1.5) return '#5A4F63';
        } else {
            if (darkContrast < 1.5) return '#5A4F63';
            if (whiteContrast < 1.5) return '#EDEEB9';
        }

        return selectedColor;
    }

    function updateButtonColors(color) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const activeColor = getActiveColor(color, isDarkMode);

        document.documentElement.style.setProperty('--active-color', activeColor);
        document.documentElement.style.setProperty('--hover-color', activeColor);
    }

    function setupEventListeners() {
        elements.darkModeToggle.addEventListener('click', () => {
            elements.darkModeToggle.classList.toggle('active');
            document.body.classList.toggle('dark-mode');
            updateButtonColors(elements.circleColorInput.value);
            settings.save();
        });

        elements.circleColorInput.addEventListener('change', () => {
            const newColor = elements.circleColorInput.value;
            elements.progressPath.style.fill = newColor;
            updateButtonColors(newColor);
            settings.save();
        });

        elements.muteSoundToggle.addEventListener('click', () => {
            elements.muteSoundToggle.classList.toggle('active');
            settings.save();
        });

        elements.alwaysShowTimeToggle.addEventListener('click', () => {
            elements.alwaysShowTimeToggle.classList.toggle('active');
            updateTimeDisplay();
            settings.save();
        });

        elements.showShortcutsToggle.addEventListener('click', () => {
            elements.showShortcutsToggle.classList.toggle('active');
            document.body.classList.toggle('shortcuts-visible');
            settings.save();
        });

        elements.settingsIcon.addEventListener('click', () => {
            elements.settingsPanel.classList.add('open');
        });

        elements.closeSettings.addEventListener('click', () => {
            elements.settingsPanel.classList.remove('open');
        });

        elements.svg.addEventListener('mousedown', startDragging);
        elements.svg.addEventListener('touchstart', startDragging);

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);

        document.addEventListener('mouseup', stopDragging);
        document.addEventListener('touchend', stopDragging);

        window.addEventListener('resize', resizeTimer);

        elements.shortbreakIcon.addEventListener('click', () => setTimer(5));
        elements.longbreakIcon.addEventListener('click', () => setTimer(15));
        elements.workIcon.addEventListener('click', () => setTimer(25));
    }

    function updateTimer(angle) {
        state.startAngle = angle;
        const normalizedAngle = (angle + 360) % 360;
        state.totalTime = Math.round(normalizedAngle / 6) * 60000;
        state.remainingTime = state.totalTime;
        updateDisplay();
        updateProgressPath(normalizedAngle);
        updateHandlePosition(normalizedAngle);
    }

    function updateDisplay() {
        const hours = Math.floor(state.remainingTime / 3600000);
        const minutes = Math.floor((state.remainingTime % 3600000) / 60000);
        const seconds = Math.floor((state.remainingTime % 60000) / 1000);
        elements.display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateProgressPath(angle) {
        const x = 55 + 45 * Math.sin(angle * Math.PI / 180);
        const y = 50 - 45 * Math.cos(angle * Math.PI / 180);
        const largeArcFlag = angle > 180 ? 1 : 0;
        elements.progressPath.setAttribute('d', `M55 5 A45 45 0 ${largeArcFlag} 1 ${x} ${y} L55 50`);
    }

    function updateHandlePosition(angle) {
        const x = 55 + 45 * Math.sin(angle * Math.PI / 180);
        const y = 50 - 45 * Math.cos(angle * Math.PI / 180);
        elements.handle.setAttribute('x2', x);
        elements.handle.setAttribute('y2', y);
    }

    let timerWorker = new Worker('timerWorker.js');
    let startTime;
    let remainingTime;
    let timerId;

    timerWorker.onmessage = function(event) {
        const { command, remainingTime: workerRemainingTime } = event.data;

        if (command === 'tick') {
            state.remainingTime = workerRemainingTime;
            if (!timerId) {
                startTime = performance.now();
                remainingTime = state.remainingTime;
                timerId = requestAnimationFrame(tick);
            }
        } else if (command === 'end') {
            state.remainingTime = 0;
            updateProgressPath(0);
            updateHandlePosition(0);
            if (!elements.muteSoundToggle.classList.contains('active')) {
                elements.timerSound.play();
            }
            cancelAnimationFrame(timerId);
            timerId = null;
        }
    };

    function tick(timestamp) {
        const elapsed = timestamp - startTime;
        state.remainingTime = remainingTime - elapsed;

        if (state.remainingTime > 0) {
            const angle = state.startAngle * (state.remainingTime / state.totalTime);
            updateProgressPath(angle);
            updateHandlePosition(angle);
            updateTimeDisplay();
            timerId = requestAnimationFrame(tick);
        } else {
            state.remainingTime = 0;
            updateProgressPath(0);
            updateHandlePosition(0);
            if (!elements.muteSoundToggle.classList.contains('active')) {
                elements.timerSound.play();
            }
            cancelAnimationFrame(timerId);
            timerId = null;
        }
    }

    function startTimer() {
        timerWorker.postMessage({ command: 'start', time: state.remainingTime });
        updateTimeDisplay();
    }

    function stopTimer() {
        timerWorker.postMessage({ command: 'stop' });
        if (timerId) cancelAnimationFrame(timerId);
    }

    function startDragging(e) {
        state.isDragging = true;
        updateTimerFromPosition(getEventPosition(e));
        elements.display.style.display = 'block';
    }

    function stopDragging() {
        if (state.isDragging) {
            state.isDragging = false;
            startTimer();
            updateTimeDisplay();
        }
    }

    function drag(e) {
        if (state.isDragging) {
            updateTimerFromPosition(getEventPosition(e));
        }
    }

    function getEventPosition(e) {
        return e.type.startsWith('touch') ? e.touches[0] : e;
    }

    function updateTimerFromPosition(position) {
        const rect = elements.svg.getBoundingClientRect();
        const centerX = rect.left + rect.width * 55 / 110;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(position.clientY - centerY, position.clientX - centerX) * 180 / Math.PI;
        const normalizedAngle = (angle + 450) % 360;
        updateTimer(normalizedAngle);
    }

    function updateTimeDisplay() {
        if (state.isDragging || elements.alwaysShowTimeToggle.classList.contains('active')) {
            elements.display.style.display = 'block';
            updateDisplay();
        } else {
            elements.display.style.display = 'none';
        }
    }

    function resizeTimer() {
        const containerSize = Math.min(window.innerWidth, window.innerHeight) * 0.8;
        elements.svg.style.width = `${containerSize}px`;
        elements.svg.style.height = `${containerSize}px`;
    }

    function setTimer(minutes) {
        const angle = minutes * 6;
        updateTimer(angle);
        startTimer();
    }

    function init() {
        settings.load();
        setupEventListeners();
        resizeTimer();
        updateProgressPath(0);
        updateHandlePosition(0);
    }

    init();
});
