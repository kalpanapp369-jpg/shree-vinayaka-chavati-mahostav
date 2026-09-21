/**
 * Main Application Orchestrator & Screen Navigation
 * Connects Game 1 (Puzzle), Game 2 (Dress-Up), Game 3 (Nimarjanam),
 * Level Selector, Achievements, Audio and Global UI
 */

class MainApp {
    constructor() {
        this.currentMode = 'menu'; // 'menu', 'puzzle', 'dressup', 'nimarjanam'
        this.activeLevelSelectorMode = 'puzzle';
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Initialize child game systems safely
        try { if (window.puzzleGame && window.puzzleGame.init) window.puzzleGame.init(); } catch (e) { console.error("Error initializing puzzle game:", e); }
        try { if (window.coloringGame && window.coloringGame.init) window.coloringGame.init(); } catch (e) { console.error("Error initializing coloring game:", e); }
        try { if (window.nimarjanamGame && window.nimarjanamGame.init) window.nimarjanamGame.init(); } catch (e) { console.error("Error initializing nimarjanam game:", e); }

        this.bindNavigationEvents();
        this.bindLevelSelectorEvents();
        this.bindAudioEvents();
        this.updateHomeStats();
        this.setupDiyaAnimations();
        this.displayPlayerGreeting();

        // Check URL parameter for quick mode jump if present
        let modeParam = null;
        let levelParam = 1;
        let viewParam = null;
        try {
            if (typeof window !== 'undefined' && window.location && window.location.search) {
                const urlParams = new URLSearchParams(window.location.search);
                modeParam = urlParams.get('mode');
                levelParam = parseInt(urlParams.get('level')) || 1;
                viewParam = urlParams.get('view');
            }
        } catch (e) {}

        if (modeParam === 'puzzle' || modeParam === 'dressup' || modeParam === 'nimarjanam') {
            this.switchMode(modeParam, { level: levelParam });
            if (viewParam === 'roadmap') {
                setTimeout(() => this.openLevelSelectorModal(modeParam), 350);
            }
        } else {
            this.switchMode('menu');
            if (viewParam === 'roadmap') {
                setTimeout(() => this.openLevelSelectorModal('puzzle'), 350);
            }
        }
    }

    bindNavigationEvents() {
        // Main Menu Mode Buttons
        const startPuzzleBtn = document.getElementById('btn-play-puzzle');
        const startDressUpBtn = document.getElementById('btn-play-dressup');
        const startNimarjanamBtn = document.getElementById('btn-play-nimarjanam');
        const openLevelSelectorBtn = document.getElementById('btn-open-level-selector');
        const openStatsBtn = document.getElementById('btn-open-stats');

        if (startPuzzleBtn) {
            startPuzzleBtn.onclick = () => {
                this.switchMode('puzzle');
            };
        }

        if (startDressUpBtn) {
            startDressUpBtn.onclick = () => {
                this.switchMode('dressup');
            };
        }

        if (startNimarjanamBtn) {
            startNimarjanamBtn.onclick = () => {
                this.switchMode('nimarjanam');
            };
        }

        if (openLevelSelectorBtn) {
            openLevelSelectorBtn.onclick = () => this.openLevelSelectorModal('puzzle');
        }

        if (openStatsBtn) {
            openStatsBtn.onclick = () => this.openStatsModal();
        }

        // Header Global Navigation Buttons
        const homeBtns = document.querySelectorAll('.nav-home-btn');
        homeBtns.forEach(btn => {
            btn.onclick = () => this.switchMode('menu');
        });

        const headerLevelBtns = document.querySelectorAll('.nav-levels-btn');
        headerLevelBtns.forEach(btn => {
            btn.onclick = () => this.openLevelSelectorModal(this.currentMode === 'menu' ? 'puzzle' : this.currentMode);
        });

        // Close Modals
        const closeButtons = document.querySelectorAll('.modal-close-btn');
        closeButtons.forEach(btn => {
            btn.onclick = () => {
                const modal = btn.closest('.modal-backdrop');
                if (modal) modal.classList.remove('active');
            };
        });
    }

    switchMode(mode, context = {}) {
        this.currentMode = mode;

        // Hide all screens
        const screens = ['screen-menu', 'screen-puzzle', 'screen-dressup', 'screen-nimarjanam'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active-screen');
        });

        // Sound effect on screen transition
        window.sacredAudio.playPieceSnap();

        // Stop inactive game timers and hide modals
        if (mode !== 'nimarjanam') {
            if (window.nimarjanamGame) {
                if (window.nimarjanamGame.stop) window.nimarjanamGame.stop();
                else if (window.nimarjanamGame.stopTimer) window.nimarjanamGame.stopTimer();
                if (window.nimarjanamGame.hideAllModals) window.nimarjanamGame.hideAllModals();
            }
        }
        if (mode !== 'puzzle') {
            if (window.puzzleGame && window.puzzleGame.stopTimer) {
                window.puzzleGame.stopTimer();
            }
        }

        if (mode === 'menu') {
            const menuEl = document.getElementById('screen-menu');
            if (menuEl) menuEl.classList.add('active-screen');
            window.sacredAudio.stopDholRhythm();
            this.updateHomeStats();
        } else if (mode === 'puzzle') {
            const puzzleEl = document.getElementById('screen-puzzle');
            if (puzzleEl) puzzleEl.classList.add('active-screen');
            window.sacredAudio.stopDholRhythm();
            const lvl = context.level || window.progressTracker.getPuzzleCurrentLevel();
            window.puzzleGame.loadLevel(lvl);
        } else if (mode === 'dressup') {
            const dressupEl = document.getElementById('screen-dressup');
            if (dressupEl) dressupEl.classList.add('active-screen');
            window.sacredAudio.stopDholRhythm();
            const lvl = context.level || window.progressTracker.getDressUpCurrentLevel();
            if (window.coloringGame) {
                window.coloringGame.loadLevel(lvl);
            } else if (window.dressupGame) {
                window.dressupGame.loadLevel(lvl);
            }
        } else if (mode === 'nimarjanam') {
            const nimarjanamEl = document.getElementById('screen-nimarjanam');
            if (nimarjanamEl) nimarjanamEl.classList.add('active-screen');
            window.nimarjanamGame.startMode(context);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateHomeStats() {
        const stats = window.progressTracker.getSummaryStats();

        const puzzleStatEl = document.getElementById('home-stat-puzzle');
        const dressupStatEl = document.getElementById('home-stat-dressup');
        const nimarjanamStatEl = document.getElementById('home-stat-nimarjanam');
        const overallProgressEl = document.getElementById('home-overall-progress');

        if (puzzleStatEl) puzzleStatEl.textContent = `${stats.puzzlesSolved} / 500 Solved`;
        if (dressupStatEl) dressupStatEl.textContent = `${stats.idolsDecorated} / 500 Painted`;
        if (nimarjanamStatEl) nimarjanamStatEl.textContent = `${stats.idolsImmersed} / 500 Immersed`;
        if (overallProgressEl) overallProgressEl.textContent = `${stats.completionPercentage}% Festival Completed`;
    }

    // --- 500 Level Selector Modal ---
    openLevelSelectorModal(mode = 'puzzle') {
        if (!mode || mode === 'menu') {
            mode = (this.currentMode && this.currentMode !== 'menu') ? this.currentMode : 'puzzle';
        }
        this.activeLevelSelectorMode = mode;
        this.activeLevelView = this.activeLevelView || 'roadmap'; // Default to Candy Crush Road Map view!

        const modal = document.getElementById('level-selector-modal');
        if (!modal) return;

        const tabs = document.querySelectorAll('.ls-tab-btn');
        tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.mode === mode);
        });

        const btnRoadmap = document.getElementById('ls-btn-roadmap');
        const btnGrid = document.getElementById('ls-btn-grid');
        if (btnRoadmap) btnRoadmap.classList.toggle('active', this.activeLevelView === 'roadmap');
        if (btnGrid) btnGrid.classList.toggle('active', this.activeLevelView === 'grid');

        this.renderCurrentLevelView();
        modal.classList.add('active');
        window.sacredAudio.playTempleBell(880, 1.0);
    }

    bindLevelSelectorEvents() {
        // Tab switching (Puzzle, Coloring, Visarjan)
        const tabs = document.querySelectorAll('.ls-tab-btn');
        tabs.forEach(t => {
            t.addEventListener('click', () => {
                tabs.forEach(tab => tab.classList.remove('active'));
                t.classList.add('active');
                this.activeLevelSelectorMode = t.dataset.mode;
                this.renderCurrentLevelView();
            });
        });

        // View toggle (Road Map vs Grid)
        const btnRoadmap = document.getElementById('ls-btn-roadmap');
        const btnGrid = document.getElementById('ls-btn-grid');

        if (btnRoadmap) {
            btnRoadmap.addEventListener('click', () => {
                this.activeLevelView = 'roadmap';
                btnRoadmap.classList.add('active');
                if (btnGrid) btnGrid.classList.remove('active');
                this.renderCurrentLevelView();
            });
        }

        if (btnGrid) {
            btnGrid.addEventListener('click', () => {
                this.activeLevelView = 'grid';
                btnGrid.classList.add('active');
                if (btnRoadmap) btnRoadmap.classList.remove('active');
                this.renderCurrentLevelView();
            });
        }

        // Jump to Current Level button
        const jumpBtn = document.getElementById('ls-btn-jump-current');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', () => {
                this.scrollToActiveNode();
            });
        }

        // Search input
        const searchInput = document.getElementById('ls-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderCurrentLevelView());
        }
    }

    renderCurrentLevelView() {
        const roadContainer = document.getElementById('candy-road-map-container');
        const grid = document.getElementById('level-selector-grid');

        if (this.activeLevelView === 'roadmap') {
            if (roadContainer) roadContainer.style.display = 'block';
            if (grid) grid.style.display = 'none';
            this.renderCandyRoadMap();
        } else {
            if (roadContainer) roadContainer.style.display = 'none';
            if (grid) grid.style.display = 'grid';
            this.renderLevelSelectorGrid();
        }
    }

    renderCandyRoadMap() {
        const container = document.getElementById('candy-road-map-container');
        const wrapper = document.getElementById('candy-road-nodes-wrapper');
        const svg = document.getElementById('candy-road-svg');
        const searchInput = document.getElementById('ls-search-input');
        if (!container || !wrapper) return;

        wrapper.innerHTML = '';
        const mode = this.activeLevelSelectorMode || 'puzzle';
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const curUnlocked = window.progressTracker.getCurrentUnlockedLevel(mode);

        const totalLevels = 500;
        const nodeSpacingY = 120;
        const startY = 80;
        const totalHeight = totalLevels * nodeSpacingY + 160;

        wrapper.style.height = `${totalHeight}px`;

        // Generate coordinates for serpentine road
        const points = [];
        for (let lvl = 1; lvl <= totalLevels; lvl++) {
            const angle = ((lvl - 1) * Math.PI) / 3;
            const xPct = 50 + 34 * Math.sin(angle);
            const y = startY + (lvl - 1) * nodeSpacingY;
            points.push({ lvl, xPct, y });
        }

        // Render SVG connecting path behind the nodes
        if (svg) {
            svg.setAttribute('height', totalHeight);
            const containerWidth = container.clientWidth || 580;
            svg.setAttribute('width', containerWidth);

            let pathD = '';
            for (let i = 0; i < points.length; i++) {
                const px = (points[i].xPct / 100) * containerWidth;
                const py = points[i].y;
                if (i === 0) {
                    pathD += `M ${px} ${py}`;
                } else {
                    const prevPx = (points[i - 1].xPct / 100) * containerWidth;
                    const prevPy = points[i - 1].y;
                    const cpY1 = prevPy + 50;
                    const cpY2 = py - 50;
                    pathD += ` C ${prevPx} ${cpY1}, ${px} ${cpY2}, ${px} ${py}`;
                }
            }

            svg.innerHTML = `
                <path d="${pathD}" fill="none" stroke="#ea580c" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
                <path d="${pathD}" fill="none" stroke="#ffffff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
                <path d="${pathD}" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 8" />
            `;
        }

        // Render Nodes
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            const lvl = pt.lvl;
            const idol = window.ganeshaCatalog.getIdol(lvl);

            // Filter search query
            if (query) {
                const matchId = String(lvl) === query;
                const matchTitle = idol.title.toLowerCase().includes(query);
                const matchMat = idol.material.name.toLowerCase().includes(query);
                if (!matchId && !matchTitle && !matchMat) continue;
            }

            const isUnlocked = window.progressTracker.isLevelUnlocked(mode, lvl);
            const isCompleted = window.progressTracker.isLevelCompleted(mode, lvl);
            const isCurrent = (lvl === curUnlocked && !isCompleted) || (lvl === 1 && !isCompleted);

            let starsCount = 0;
            if (mode === 'puzzle') {
                const stats = window.progressTracker.getPuzzleLevelStats(lvl);
                starsCount = stats ? (stats.stars || 3) : (isCompleted ? 3 : 0);
            } else if (isCompleted) {
                starsCount = 3;
            }

            // Milestone Arches (every 10, 25, 50, 100, 250, 500 levels)
            if (lvl === 10 || lvl === 25 || lvl === 50 || lvl === 100 || lvl === 250 || lvl === 500) {
                const arch = document.createElement('div');
                arch.className = 'milestone-arch';
                arch.style.top = `${pt.y - 65}px`;
                arch.innerHTML = `⛩️ MILESTONE: LEVEL ${lvl} • ${idol.archetypeName}`;
                fragment.appendChild(arch);
            }

            // Level Node
            const nodeEl = document.createElement('div');
            nodeEl.className = `candy-road-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;
            nodeEl.style.left = `${pt.xPct}%`;
            nodeEl.style.top = `${pt.y}px`;
            nodeEl.dataset.level = lvl;

            let badgeHtml = '';
            if (isCompleted) {
                badgeHtml = `<div class="nic-badge">⭐ ${'★'.repeat(starsCount)} • Replay 🔄</div>`;
            } else if (isCurrent) {
                badgeHtml = `<div class="nic-badge active-badge">🔥 Next to Play</div>`;
            } else {
                badgeHtml = `<div class="nic-badge locked-badge">🔒 Locked</div>`;
            }

            nodeEl.innerHTML = `
                ${isCurrent ? `<div class="current-avatar-pin"><span class="cap-emoji">🪷</span><span class="cap-label">PLAY ▶</span></div>` : ''}
                <div class="node-circle-btn">
                    ${!isUnlocked ? '<span class="node-lock-icon">🔒</span>' : `<span class="node-num">${lvl}</span>`}
                </div>
                <div class="node-info-card">
                    <div class="nic-title">${idol.archetypeName}</div>
                    ${badgeHtml}
                </div>
            `;

            nodeEl.onclick = () => {
                if (!isUnlocked) {
                    nodeEl.classList.remove('shake-locked');
                    void nodeEl.offsetWidth; // trigger reflow
                    nodeEl.classList.add('shake-locked');
                    window.sacredAudio.playPieceSnap();
                    this.showRoadLockToast(`🔒 Level ${lvl} is locked! Complete Level ${lvl - 1} first to unlock!`);
                    return;
                }

                // Unlocked or Completed (Replayable anytime!)
                const modal = document.getElementById('level-selector-modal');
                if (modal) modal.classList.remove('active');
                window.sacredAudio.playPieceSnap();

                if (mode === 'puzzle') {
                    this.switchMode('puzzle', { level: lvl });
                } else if (mode === 'dressup') {
                    this.switchMode('dressup', { level: lvl });
                } else if (mode === 'nimarjanam') {
                    this.switchMode('nimarjanam', { fromMode: 'direct', level: lvl });
                }
            };

            fragment.appendChild(nodeEl);
        }

        wrapper.appendChild(fragment);

        // Auto scroll to current level
        this.scrollToActiveNode();
    }

    scrollToActiveNode() {
        const container = document.getElementById('candy-road-map-container');
        if (!container) return;

        setTimeout(() => {
            const activeNode = container.querySelector('.candy-road-node.current') || 
                               container.querySelector('.candy-road-node.completed:last-of-type') ||
                               container.querySelector('.candy-road-node');
            if (activeNode) {
                const targetY = activeNode.offsetTop - container.clientHeight / 2 + 30;
                container.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
            }
        }, 120);
    }

    renderLevelSelectorGrid() {
        const grid = document.getElementById('level-selector-grid');
        const searchInput = document.getElementById('ls-search-input');
        if (!grid) return;

        grid.innerHTML = '';
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const mode = this.activeLevelSelectorMode || 'puzzle';
        const curUnlocked = window.progressTracker.getCurrentUnlockedLevel(mode);

        for (let lvl = 1; lvl <= 500; lvl++) {
            const idol = window.ganeshaCatalog.getIdol(lvl);

            // Filter search query
            if (query) {
                const matchId = String(lvl) === query;
                const matchTitle = idol.title.toLowerCase().includes(query);
                const matchMat = idol.material.name.toLowerCase().includes(query);
                if (!matchId && !matchTitle && !matchMat) continue;
            }

            const isUnlocked = window.progressTracker.isLevelUnlocked(mode, lvl);
            const isCompleted = window.progressTracker.isLevelCompleted(mode, lvl);
            const isCurrent = (lvl === curUnlocked && !isCompleted) || (lvl === 1 && !isCompleted);

            let badgeText = '';
            if (mode === 'puzzle') {
                const stat = window.progressTracker.getPuzzleLevelStats(lvl);
                if (stat) badgeText = '⭐'.repeat(stat.stars);
            } else if (mode === 'dressup') {
                if (isCompleted) badgeText = '✨ Done';
            } else if (mode === 'nimarjanam') {
                if (isCompleted) badgeText = '🌊 Immersed';
            }

            const card = document.createElement('div');
            card.className = `level-grid-card ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;
            
            const isColoring = (mode === 'dressup');
            const thumbSrc = isColoring ? (idol.coloringImageSrc || idol.imageSrc) : idol.imageSrc;

            card.innerHTML = `
                <img class="lg-thumb ${isColoring ? 'coloring-thumb' : ''}" src="${thumbSrc}" alt="${idol.archetypeName}" loading="lazy" />
                <div class="lg-level-num">Level ${lvl} ${!isUnlocked ? '🔒' : (isCompleted ? '✅' : '▶')}</div>
                <div class="lg-title">${idol.archetypeName}</div>
                <div class="lg-material">${idol.category}</div>
                ${badgeText ? `<div class="lg-badge">${badgeText}</div>` : (!isUnlocked ? '<div class="lg-badge" style="color:#6b7280;">Locked</div>' : '<div class="lg-badge" style="color:#16a34a;">Play Now</div>')}
            `;

            card.onclick = () => {
                if (!isUnlocked) {
                    window.sacredAudio.playPieceSnap();
                    this.showRoadLockToast(`🔒 Level ${lvl} is locked! Complete Level ${lvl - 1} first to unlock!`);
                    return;
                }

                const modal = document.getElementById('level-selector-modal');
                if (modal) modal.classList.remove('active');

                if (mode === 'puzzle') {
                    this.switchMode('puzzle', { level: lvl });
                } else if (mode === 'dressup') {
                    this.switchMode('dressup', { level: lvl });
                } else if (mode === 'nimarjanam') {
                    this.switchMode('nimarjanam', { fromMode: 'direct', level: lvl });
                }
            };

            grid.appendChild(card);
        }
    }

    showRoadLockToast(msg) {
        let toast = document.getElementById('road-lock-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'road-lock-toast';
            toast.className = 'road-lock-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    // --- Stats & Achievements Modal ---
    openStatsModal() {
        const modal = document.getElementById('stats-modal');
        if (!modal) return;

        const stats = window.progressTracker.getSummaryStats();
        const scoreEl = document.getElementById('stats-total-score');
        const starsEl = document.getElementById('stats-total-stars');
        const puzzlesEl = document.getElementById('stats-puzzles-count');
        const dressupsEl = document.getElementById('stats-dressups-count');
        const immersionsEl = document.getElementById('stats-immersions-count');
        const achListEl = document.getElementById('stats-achievements-list');

        if (scoreEl) scoreEl.textContent = stats.totalScore.toLocaleString();
        if (starsEl) starsEl.textContent = `${stats.totalStars} ⭐`;
        if (puzzlesEl) puzzlesEl.textContent = `${stats.puzzlesSolved} / 500`;
        if (dressupsEl) dressupsEl.textContent = `${stats.idolsDecorated} / 500`;
        if (immersionsEl) immersionsEl.textContent = `${stats.idolsImmersed} / 500`;

        if (achListEl) {
            achListEl.innerHTML = '';
            const achs = window.progressTracker.data.achievements || [];
            if (achs.length === 0) {
                achListEl.innerHTML = '<li class="no-ach">Start solving puzzles, painting divine murtis, or performing visarjan to unlock sacred achievements!</li>';
            } else {
                achs.forEach(ach => {
                    const li = document.createElement('li');
                    li.className = 'ach-item';
                    li.innerHTML = `🏆 <b>${ach}</b>`;
                    achListEl.appendChild(li);
                });
            }
        }

        modal.classList.add('active');
        window.sacredAudio.playTempleBell(980, 1.2);
    }

    // --- Audio & Ambient Controls ---
    bindAudioEvents() {
        const muteBtn = document.getElementById('audio-mute-toggle');
        const musicBtn = document.getElementById('audio-music-toggle');
        const bellBtn = document.getElementById('sacred-bell-trigger');

        if (muteBtn) {
            muteBtn.onclick = () => {
                const isMuted = window.sacredAudio.toggleMute();
                muteBtn.classList.toggle('muted', isMuted);
                muteBtn.innerHTML = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
            };
        }

        if (musicBtn) {
            musicBtn.onclick = () => {
                const isPlaying = window.sacredAudio.toggleAmbient();
                musicBtn.classList.toggle('active', isPlaying);
                musicBtn.innerHTML = isPlaying ? '🪕 Bhajan/Drone On' : '🪕 Bhajan/Drone Off';
            };
        }

        if (bellBtn) {
            bellBtn.onclick = () => {
                window.sacredAudio.playTempleBell(880, 2.5);
                window.sacredAudio.playShankha(2.0);
            };
        }
    }

    setupDiyaAnimations() {
        // Subtle ambient floating petals in background
        const bgContainer = document.getElementById('ambient-particles-layer');
        if (!bgContainer) return;

        for (let i = 0; i < 18; i++) {
            const petal = document.createElement('div');
            petal.className = 'ambient-floating-petal';
            petal.style.left = `${Math.random() * 100}%`;
            petal.style.top = `${Math.random() * 100}%`;
            petal.style.animationDuration = `${6 + Math.random() * 8}s`;
            petal.style.animationDelay = `${Math.random() * 5}s`;
            bgContainer.appendChild(petal);
        }

        this.setupSparkleCursorTrail();
        this.setupGlobalButtonSounds();
    }

    // --- Dynamic Golden Sparkle Cursor Trail Effect ---
    setupSparkleCursorTrail() {
        let lastSparkleTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = performance.now();
            if (now - lastSparkleTime < 45) return; // Throttle to 22fps for smooth performance
            lastSparkleTime = now;

            const isInteractive = e.target.closest('button, .game-mode-card, .puzzle-piece, .color-swatch, .btn-tool, a, input');
            if (isInteractive || Math.random() < 0.25) {
                const spark = document.createElement('div');
                spark.className = 'cursor-sparkle';
                spark.style.left = `${e.clientX + (Math.random() - 0.5) * 12}px`;
                spark.style.top = `${e.clientY + (Math.random() - 0.5) * 12}px`;
                const size = 4 + Math.random() * 6;
                spark.style.width = `${size}px`;
                spark.style.height = `${size}px`;
                spark.style.backgroundColor = Math.random() > 0.3 ? '#ffd700' : '#ff9800';
                document.body.appendChild(spark);

                setTimeout(() => {
                    spark.remove();
                }, 750);
            }
        }, { passive: true });
    }

    // --- Soft Sound Feedback on Buttons ---
    setupGlobalButtonSounds() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button, .btn-icon-text, .btn-primary-divine, .btn-secondary-divine, .grid-size-btn, .btn-tool');
            if (btn && window.sacredAudio && !window.sacredAudio.isMuted) {
                // Play subtle soft bell / chime
                if (btn.id === 'sacred-bell-trigger') return; // already handled
                window.sacredAudio.playPieceSnap();
            }
        });
    }

    displayPlayerGreeting() {
        try {
            const pName = localStorage.getItem('ganesh_player_name');
            if (pName) {
                const badge = document.getElementById('player-welcome-badge');
                const nameSpan = document.getElementById('player-welcome-name');
                if (badge && nameSpan) {
                    nameSpan.textContent = pName;
                    badge.style.display = 'inline-flex';
                }
            }
        } catch (e) {
            console.warn("Could not display player greeting", e);
        }
    }
}

// Global Main Application instance
window.mainApp = new MainApp();

// Boot up once DOM is loaded or immediately if already interactive
function bootApp() {
    if (window.mainApp && !window.mainApp.isInitialized) {
        window.mainApp.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}
