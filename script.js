document.addEventListener('DOMContentLoaded', () => {
    // Service Worker 註冊
    const initServiceWorker = () => {
        if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js')
                    .then((registration) => console.log('Service Worker 註冊成功:', registration.scope))
                    .catch((error) => console.log('Service Worker 註冊失敗:', error));
            }
        } else {
            console.log('Service Worker 不支持在當前環境運行');
        }
    };

    // DOM 元素
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
        icon1: document.getElementById('icon1'),
        icon2: document.getElementById('icon2'),
        icon3: document.getElementById('icon3'),
        fullscreenToggle: document.querySelector('.fullscreen-icon')
    };

    // 狀態管理
    const state = {
        isDragging: false,
        totalTime: 0,
        remainingTime: 0,
        timerInterval: null,
        startAngle: 0
    };

    // 設定管理
    const settings = {
        defaultSettings: {
            darkMode: false,
            circleColor: '#4CAF50',
            muteSound: false,
            alwaysShowTime: false,
            showShortcuts: false,
            fullscreen: false,
            iconCategories: {
                time: [
                    'fa-clock', 'fa-hourglass', 'fa-stopwatch', 'fa-bell', 
                    'fa-calendar', 'fa-calendar-alt', 'fa-calendar-check'
                ],
                break: [
                    'fa-coffee', 'fa-mug-hot', 'fa-cookie', 'fa-ice-cream',
                    'fa-pizza-slice', 'fa-hamburger', 'fa-candy-cane'
                ],
                work: [
                    'fa-briefcase', 'fa-laptop', 'fa-desktop', 'fa-keyboard',
                    'fa-tasks', 'fa-clipboard', 'fa-pencil-alt'
                ],
                other: [
                    'fa-star', 'fa-heart', 'fa-bookmark', 'fa-flag',
                    'fa-bell', 'fa-gem', 'fa-crown'
                ]
            }
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
                showShortcuts: elements.showShortcutsToggle.classList.contains('active'),
                icons: this.getIconSettings()
            };
            localStorage.setItem('timerSettings', JSON.stringify(currentSettings));
            uiUpdater.updateHandleColor(currentSettings.circleColor);
        },

        applySettings(settings) {
            if (settings.darkMode) {
                document.body.classList.add('dark-mode');
                elements.darkModeToggle.classList.add('active');
            }
            if (settings.muteSound) elements.muteSoundToggle.classList.add('active');
            if (settings.alwaysShowTime) elements.alwaysShowTimeToggle.classList.add('active');
            if (settings.showShortcuts) {
                elements.showShortcutsToggle.classList.add('active');
                document.body.classList.add('shortcuts-visible');
                document.querySelector('.icon-settings').style.display = 'block';
            }
            elements.progressPath.style.fill = settings.circleColor;
            elements.circleColorInput.value = settings.circleColor;
            uiUpdater.updateHandleColor(settings.circleColor);
            uiUpdater.updateButtonColors(settings.circleColor);
            uiUpdater.updateTimeDisplay();

            // 套用圖示設定
            if (settings.icons) {
                const inputs = document.querySelectorAll('.minutes-input');
                const icons = document.querySelectorAll('.current-icon');
                settings.icons.forEach((iconSetting, index) => {
                    if (inputs[index]) {
                        inputs[index].value = iconSetting.minutes;
                    }
                    if (icons[index]) {
                        // 移除所有現有的 font-awesome 類別
                        icons[index].className = icons[index].className
                            .split(' ')
                            .filter(cls => !cls.startsWith('fa-'))
                            .join(' ');
                        // 加入新的圖示類別
                        icons[index].classList.add('fas', iconSetting.icon);
                        
                        // 更新 SVG 中的圖示
                        const svgIcon = elements[`icon${index + 1}`].querySelector('i');
                        svgIcon.className = `fas ${iconSetting.icon}`;
                    }
                });
                // 更新圖示位置
                uiUpdater.updateIconPositions();
            }
        },

        getIconSettings() {
            const iconSettings = [];
            document.querySelectorAll('.icon-setting').forEach((setting, index) => {
                iconSettings.push({
                    id: `icon${index + 1}`,
                    minutes: parseInt(setting.querySelector('.minutes-input').value),
                    icon: Array.from(setting.querySelector('.current-icon').classList)
                        .find(cls => cls.startsWith('fa-'))
                });
            });
            return iconSettings;
        }
    };

    // 顏色處理工具
    const colorUtils = {
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        calculateRelativeLuminance(color) {
            const rgb = this.hexToRgb(color);
            return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
        },

        calculateContrast(color1, color2) {
            const l1 = this.calculateRelativeLuminance(color1);
            const l2 = this.calculateRelativeLuminance(color2);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        },

        getActiveColor(selectedColor, isDarkMode) {
            const whiteContrast = this.calculateContrast(selectedColor, '#FFFFFF');
            const darkContrast = this.calculateContrast(selectedColor, '#444444');

            if (isDarkMode) {
                if (whiteContrast < 1.5) return '#EDEEB9';
                if (darkContrast < 1.5) return '#5A4F63';
            } else {
                if (darkContrast < 1.5) return '#5A4F63';
                if (whiteContrast < 1.5) return '#EDEEB9';
            }
            return selectedColor;
        }
    };

    // UI 更新函數
    const uiUpdater = {
        updateHandleColor(color) {
            const rgb = colorUtils.hexToRgb(color);
            const darkerColor = `rgb(${rgb.r * 0.8}, ${rgb.g * 0.8}, ${rgb.b * 0.8})`;
            elements.handle.style.stroke = darkerColor;
        },

        updateButtonColors(color) {
            const isDarkMode = document.body.classList.contains('dark-mode');
            const activeColor = colorUtils.getActiveColor(color, isDarkMode);
            document.documentElement.style.setProperty('--active-color', activeColor);
            document.documentElement.style.setProperty('--hover-color', activeColor);
        },

        updateDisplay() {
            const hours = Math.floor(state.remainingTime / 3600000);
            const minutes = Math.floor((state.remainingTime % 3600000) / 60000);
            const seconds = Math.floor((state.remainingTime % 60000) / 1000);
            elements.display.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },

        updateProgressPath(angle) {
            const x = 55 + 45 * Math.sin(angle * Math.PI / 180);
            const y = 55 - 45 * Math.cos(angle * Math.PI / 180);
            const largeArcFlag = angle > 180 ? 1 : 0;
            elements.progressPath.setAttribute('d', `M55 10 A45 45 0 ${largeArcFlag} 1 ${x} ${y} L55 55`);
        },

        updateHandlePosition(angle) {
            const x = 55 + 45 * Math.sin(angle * Math.PI / 180);
            const y = 55 - 45 * Math.cos(angle * Math.PI / 180);
            elements.handle.setAttribute('x2', x);
            elements.handle.setAttribute('y2', y);
        },

        updateTimeDisplay() {
            if (state.isDragging || elements.alwaysShowTimeToggle.classList.contains('active')) {
                elements.display.style.display = 'block';
                this.updateDisplay();
            } else {
                elements.display.style.display = 'none';
            }
        },

        calculateIconPosition(minutes) {
            const centerX = 55;
            const centerY = 55;
            const radius = 45;
            const distance = radius * 1.1;
            const angle = (minutes * 6 - 90) * (Math.PI / 180);
            
            const x = centerX + distance * Math.cos(angle);
            const y = centerY + distance * Math.sin(angle);
            
            return {
                x: x,
                y: y,
                transform: `translate(-2.5, -2.5)`
            };
        },

        animateIconPosition(element, currentX, currentY, targetX, targetY) {
            const startTime = performance.now();
            const duration = 300; // 動畫持續 300 毫秒
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 使用 easeOutQuad 緩動函數讓動畫更順暢
                const eased = 1 - (1 - progress) * (1 - progress);
                
                const x = currentX + (targetX - currentX) * eased;
                const y = currentY + (targetY - currentY) * eased;
                
                element.setAttribute('x', x);
                element.setAttribute('y', y);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },

        updateIconPositions() {
            const inputs = document.querySelectorAll('.minutes-input');
            
            // 儲存當前位置
            const getCurrentPosition = (element) => ({
                x: parseFloat(element.getAttribute('x')) || 0,
                y: parseFloat(element.getAttribute('y')) || 0
            });

            // 更新每個圖示的位置
            [elements.icon1, elements.icon2, elements.icon3].forEach((icon, index) => {
                const currentPos = getCurrentPosition(icon);
                const targetPos = this.calculateIconPosition(parseInt(inputs[index].value));
                
                this.animateIconPosition(
                    icon,
                    currentPos.x,
                    currentPos.y,
                    targetPos.x,
                    targetPos.y
                );
                // 保持 transform 屬性不變
                icon.setAttribute('transform', targetPos.transform);
            });
        },

        resizeTimer() {
            const isFullscreen = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement;

            if (isFullscreen) {
                // 計算螢幕對角線長度
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const diagonal = Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2));
                
                // 計算需要的縮放比例
                // 由於 SVG viewBox 是 110x110，圓形半徑是 45
                // 我們需要讓圓形直徑（90）等於對角線長度
                const scale = diagonal / 90;
                
                // 設置 SVG 的尺寸
                elements.svg.style.width = `${110 * scale}px`;
                elements.svg.style.height = `${110 * scale}px`;
                
                // 調整 SVG 的位置，使其置中
                elements.svg.style.position = 'absolute';
                elements.svg.style.left = `${(screenWidth - (110 * scale)) / 2}px`;
                elements.svg.style.top = `${(screenHeight - (110 * scale)) / 2}px`;
            } else {
                // 恢復原始大小
                const containerSize = Math.min(window.innerWidth, window.innerHeight) * 0.8;
                elements.svg.style.width = `${containerSize}px`;
                elements.svg.style.height = `${containerSize}px`;
                elements.svg.style.position = '';
                elements.svg.style.left = '';
                elements.svg.style.top = '';
            }

            // 更新圖示位置
            this.updateIconPositions();
        },

        showIconPicker() {
            const picker = document.querySelector('.icon-picker');
            picker.style.display = 'block';
        },
        
        hideIconPicker() {
            const picker = document.querySelector('.icon-picker');
            picker.style.display = 'none';
        },
        
        updateIconList(category, icons) {
            const iconList = document.querySelector('.icon-list');
            iconList.innerHTML = '';
            
            icons.forEach(icon => {
                const i = document.createElement('i');
                i.className = `fas ${icon}`;
                i.addEventListener('click', () => iconPicker.selectIcon(icon));
                iconList.appendChild(i);
            });
        },
        
        updateIconCategories(activeCategory) {
            document.querySelectorAll('.icon-categories i').forEach(category => {
                category.classList.toggle('active', category.dataset.category === activeCategory);
            });
        },
        
        updateIcon(target, iconClass) {
            // 更新設定面板中的圖示
            target.className = `fas ${iconClass} current-icon`;
            
            // 更新時鐘面板上的圖示
            const settingRow = target.closest('.icon-setting');
            const index = Array.from(settingRow.parentNode.children).indexOf(settingRow);
            const svgIcon = elements[`icon${index + 1}`].querySelector('i');
            svgIcon.className = `fas ${iconClass}`;
        }
    };

    // 計時器控制
    const timerController = {
        worker: new Worker('timeWorker.js'),
        startTime: null,
        timerId: null,

        init() {
            // 設置 worker 消息處理
            this.worker.onmessage = (event) => {
                const { command, remainingTime } = event.data;
                if (command === 'tick') {
                    this.handleTick(remainingTime);
                } else if (command === 'end') {
                    this.handleEnd();
                }
            };
        },

        handleTick(workerRemainingTime) {
            if (state.isDragging) {
                return;
            }

            state.remainingTime = workerRemainingTime;
            if (!this.timerId) {
                this.startTime = performance.now();
                this.timerId = requestAnimationFrame(this.tick.bind(this));
            }
            // 更新顯示
            uiUpdater.updateDisplay();
            const angle = state.startAngle * (state.remainingTime / state.totalTime);
            uiUpdater.updateProgressPath(angle);
            uiUpdater.updateHandlePosition(angle);
        },

        handleEnd() {
            state.remainingTime = 0;
            uiUpdater.updateProgressPath(0);
            uiUpdater.updateHandlePosition(0);
            if (!elements.muteSoundToggle.classList.contains('active')) {
                elements.timerSound.play();
            }
            this.stopAnimation();
        },

        tick(timestamp) {
            if (state.remainingTime > 0) {
                this.timerId = requestAnimationFrame(this.tick.bind(this));
            } else {
                this.handleEnd();
            }
        },

        start() {
            // 確保先停止現有計時器
            this.stop();
            // 發送開始命令 worker
            this.worker.postMessage({ 
                command: 'start', 
                time: state.remainingTime 
            });
        },

        stop() {
            if (this.timerId) {
                cancelAnimationFrame(this.timerId);
                this.timerId = null;
            }
        },

        stopAnimation() {
            if (this.timerId) {
                cancelAnimationFrame(this.timerId);
                this.timerId = null;
            }
        }
    };

    // 拖曳控制
    const dragController = {
        startDragging(e) {
            state.isDragging = true;
            this.updateTimerFromPosition(this.getEventPosition(e));
            elements.display.style.display = 'block';
        },

        stopDragging() {
            if (state.isDragging) {
                state.isDragging = false;
                timerController.start();
                uiUpdater.updateTimeDisplay();
            }
        },

        drag(e) {
            if (state.isDragging) {
                this.updateTimerFromPosition(this.getEventPosition(e));
            }
        },

        getEventPosition(e) {
            return e.type.startsWith('touch') ? e.touches[0] : e;
        },

        updateTimerFromPosition(position) {
            const rect = elements.svg.getBoundingClientRect();
            const centerX = rect.left + rect.width * 55 / 110;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(position.clientY - centerY, position.clientX - centerX) * 180 / Math.PI;
            const normalizedAngle = (angle + 450) % 360;
            this.updateTimer(normalizedAngle);
        },

        updateTimer(angle) {
            state.startAngle = angle;
            const normalizedAngle = (angle + 360) % 360;
            state.totalTime = Math.round(normalizedAngle / 6) * 60000;
            state.remainingTime = state.totalTime;
            uiUpdater.updateDisplay();
            uiUpdater.updateProgressPath(normalizedAngle);
            uiUpdater.updateHandlePosition(normalizedAngle);
        }
    };

    // 圖示選擇器控制
    const iconPicker = {
        currentTarget: null,
        
        init() {
            this.setupEventListeners();
        },
        
        setupEventListeners() {
            // 點擊分類切換圖示列表
            document.querySelectorAll('.icon-categories i').forEach(category => {
                category.addEventListener('click', (e) => {
                    const selectedCategory = e.target.dataset.category;
                    uiUpdater.updateIconCategories(selectedCategory);
                    this.showIcons(selectedCategory);
                });
            });
            
            // 點擊外部關閉選擇器
            document.addEventListener('click', (e) => {
                const picker = document.querySelector('.icon-picker');
                if (!picker.contains(e.target) && !e.target.classList.contains('current-icon')) {
                    uiUpdater.hideIconPicker();
                }
            });
        },
        
        showPicker(target, event) {
            this.currentTarget = target;
            uiUpdater.showIconPicker();
            this.showIcons('time');
            event.stopPropagation();
        },
        
        showIcons(category) {
            uiUpdater.updateIconList(
                category, 
                settings.defaultSettings.iconCategories[category]
            );
        },
        
        selectIcon(iconClass) {
            if (this.currentTarget) {
                uiUpdater.updateIcon(this.currentTarget, iconClass);
                settings.save();
                uiUpdater.hideIconPicker();
            }
        }
    };

    // 事件監聽器設定
    function setupEventListeners() {
        // 設定面板相關
        elements.darkModeToggle.addEventListener('click', () => {
            elements.darkModeToggle.classList.toggle('active');
            document.body.classList.toggle('dark-mode');
            uiUpdater.updateButtonColors(elements.circleColorInput.value);
            settings.save();
        });

        elements.circleColorInput.addEventListener('change', () => {
            const newColor = elements.circleColorInput.value;
            elements.progressPath.style.fill = newColor;
            uiUpdater.updateButtonColors(newColor);
            settings.save();
        });

        elements.muteSoundToggle.addEventListener('click', () => {
            elements.muteSoundToggle.classList.toggle('active');
            settings.save();
        });

        elements.alwaysShowTimeToggle.addEventListener('click', () => {
            elements.alwaysShowTimeToggle.classList.toggle('active');
            uiUpdater.updateTimeDisplay();
            settings.save();
        });

        elements.showShortcutsToggle.addEventListener('click', () => {
            elements.showShortcutsToggle.classList.toggle('active');
            document.body.classList.toggle('shortcuts-visible');
            
            // 同時控制圖示設定區域的顯示
            const iconSettings = document.querySelector('.icon-settings');
            iconSettings.style.display = elements.showShortcutsToggle.classList.contains('active') ? 'block' : 'none';
            
            settings.save();
        });

        // 設定面板開關
        elements.settingsIcon.addEventListener('click', () => {
            elements.settingsPanel.classList.add('open');
        });

        elements.closeSettings.addEventListener('click', () => {
            elements.settingsPanel.classList.remove('open');
        });

        // 拖曳相關
        const dragElements = [
            elements.progressPath,
            elements.handle,
            document.querySelector('.timer-background')  // 背景圓圈
        ];

        // 拖曳相關
        dragElements.forEach(element => {
            element.addEventListener('mousedown', e => dragController.startDragging(e));
            element.addEventListener('touchstart', e => dragController.startDragging(e), { passive: false });
        });

        document.addEventListener('mousemove', e => dragController.drag(e));
        document.addEventListener('touchmove', e => dragController.drag(e), { passive: false });
        document.addEventListener('mouseup', () => dragController.stopDragging());
        document.addEventListener('touchend', () => dragController.stopDragging(), { passive: true });

        // 視窗大小調整
        window.addEventListener('resize', () => uiUpdater.resizeTimer());

        // 修改快捷按鈕事件綁定，使用設定中的實際分鐘數
        elements.icon1.querySelector('i').addEventListener('click', (e) => {
            e.stopPropagation();
            const minutes = parseInt(document.querySelectorAll('.minutes-input')[0].value);
            setTimer(minutes);
        });
        elements.icon2.querySelector('i').addEventListener('click', (e) => {
            e.stopPropagation();
            const minutes = parseInt(document.querySelectorAll('.minutes-input')[1].value);
            setTimer(minutes);
        });
        elements.icon3.querySelector('i').addEventListener('click', (e) => {
            e.stopPropagation();
            const minutes = parseInt(document.querySelectorAll('.minutes-input')[2].value);
            setTimer(minutes);
        });

        // 全螢幕切換
        elements.fullscreenToggle.addEventListener('click', () => {
            toggleFullScreen();
        });

        // 監聽全螢幕狀態變化
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);

        // 修改分鐘輸入的監聽，改用 input 事件以實現即時更新
        document.querySelectorAll('.minutes-input').forEach(input => {
            input.addEventListener('input', handleMinutesInput);
            input.addEventListener('keydown', handleMinutesKeydown);
            input.addEventListener('wheel', handleMinutesWheel, { passive: false });
        });

        // 在 setupEventListeners 中加入圖示點擊事件
        document.querySelectorAll('.current-icon').forEach(icon => {
            icon.addEventListener('click', (e) => iconPicker.showPicker(icon, e));
        });
    }

    // 設定計時器
    function setTimer(minutes) {
        const angle = minutes * 6;
        dragController.updateTimer(angle);
        timerController.start();
    }

    // 初始化
    function init() {
        initServiceWorker();
        settings.load();
        setupEventListeners();
        timerController.init();
        uiUpdater.resizeTimer();
        uiUpdater.updateProgressPath(0);
        uiUpdater.updateHandlePosition(0);
        uiUpdater.updateIconPositions(); // 初始化圖示位置
        iconPicker.init();
    }

    init();

    // 將這些函數移到 DOMContentLoaded 事件處理器內部
    function toggleFullScreen() {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement) {
            // 進入全螢幕
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            }
        } else {
            // 退出全螢幕
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        }
    }

    function handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement;
        
        elements.fullscreenToggle.classList.toggle('active', isFullscreen);
        document.body.classList.toggle('super-fullscreen', isFullscreen);
        
        // 在全螢幕狀態改變時重新計算尺寸
        uiUpdater.resizeTimer();
    }

    function handleMinutesInput(e) {
        let value = e.target.value;
        
        if (!/^\d*\.?\d*$/.test(value)) {
            value = '60';
        }
        
        value = Math.floor(parseFloat(value));
        
        if (value === 0 || isNaN(value)) {
            value = 60;
        }
        
        if (value > 60) {
            value = 1;
        } else if (value < 1) {
            value = 60;
        }
        
        e.target.value = value;
        settings.save();
        uiUpdater.updateIconPositions();
    }

    function handleMinutesKeydown(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            let value = parseInt(e.target.value);
            value = e.key === 'ArrowUp' 
                ? (value >= 60 ? 1 : value + 1)
                : (value <= 1 ? 60 : value - 1);
            e.target.value = value;
            settings.save();
            uiUpdater.updateIconPositions();
        }
    }

    function handleMinutesWheel(e) {
        e.preventDefault();
        let value = parseInt(e.target.value);
        value = e.deltaY < 0
            ? (value >= 60 ? 1 : value + 1)
            : (value <= 1 ? 60 : value - 1);
        e.target.value = value;
        settings.save();
        uiUpdater.updateIconPositions();
    }
});
