/**
 * Game 3: Ganesh Nimajjanam Immersion (Exact Replica of Real-Life Visarjan & 'naveen.immersion')
 * 
 * Authentic Real-Life Nimajjanam Flow:
 * 1. Road queue of realistic Ganesh idols on ornate golden thrones.
 * 2. Heavy industrial tower crane hooks idol (+25) and carries it across the road over water.
 * 3. Crane lowers idol into the water for sacred dips and immersion.
 * 4. IN THE WATER: The idol is RELEASED and SINKS deep into the riverbed, dissolving into golden sparkles.
 * 5. THE CRANE RISES UP COMPLETELY EMPTY (Only the bare hook & slings rise out of the water).
 * 6. The empty crane travels back to the road pickup station.
 * 7. The next idol in the road queue slides forward, ready to be picked next!
 * 8. 100% continuous multi-idol loop with zero lockups.
 */

class NimarjanamGame {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.laddusCount = 0;
        this.idolsImmersedInLevel = 0;
        this.targetIdolsForLevel = 1;
        this.levelTimeLimit = 65; // Level 1: 65s, Level 2: 125s, Level 3: 185s...
        this.timerSeconds = 65;
        this.timerInterval = null;
        this.isLevelCompleted = false;
        this.isTimeUp = false;
        this.zoomScale = 1.0;
        this.time = 0;        // Global animation clock (incremented each frame)

        // Canvas & Context
        this.canvas = null;
        this.ctx = null;
        this.animFrameId = null;

        // Photorealistic Scenic Ghat Backgrounds
        this.envImages = {
            lake: new Image(),
            river: new Image(),
            night: new Image(),
            greenery: new Image(),
            village: new Image()
        };
        this.envImages.lake.src = 'assets/images/nimarjanam_bg.jpg';
        this.envImages.river.src = 'assets/images/ghat_river.jpg';
        this.envImages.night.src = 'assets/images/ghat_night.jpg';
        this.envImages.greenery.src = 'assets/images/ghat_greenery.jpg';
        this.envImages.village.src = 'assets/images/ghat_temple.jpg';

        this.bgImage = this.envImages.lake;

        // Idol Archetypes Catalog (Realistic 3D Sculpted Vigrahams with distinct grip dimensions)
        this.archetypes = [
            { id: 'lalbaug', name: 'Lalbaugcha Raja 3D', file: 'assets/images/sprites/lalbaug_3d.png', width: 96, height: 118, gripWidth: 92 },
            { id: 'dagdusheth', name: 'Dagdusheth Halwai 3D', file: 'assets/images/sprites/dagdusheth_3d.png', width: 106, height: 118, gripWidth: 104 },
            { id: 'bal_ganesh', name: 'Bal Ganesha 3D', file: 'assets/images/sprites/bal_ganesh_3d.png', width: 78, height: 105, gripWidth: 74 },
            { id: 'siddhivinayak', name: 'Siddhivinayak 3D', file: 'assets/images/sprites/siddhivinayak_3d.png', width: 90, height: 116, gripWidth: 86 },
            { id: 'panchamukhi', name: 'Panchamukhi 3D', file: 'assets/images/sprites/panchamukhi_3d.png', width: 112, height: 120, gripWidth: 110 },
            { id: 'nritya', name: 'Dancing Ganesha 3D', file: 'assets/images/sprites/nritya_3d.png', width: 84, height: 114, gripWidth: 80 },
            { id: 'chola_bronze', name: 'Chola Bronze 3D', file: 'assets/images/sprites/chola_bronze_3d.png', width: 76, height: 110, gripWidth: 72 },
            { id: 'terracotta', name: 'Terracotta Clay 3D', file: 'assets/images/sprites/terracotta_3d.png', width: 88, height: 115, gripWidth: 84 }
        ];

        this.loadedImages = {};
        this.preloadArchetypeImages();

        // Road Queue of Idols
        this.idolQueue = [];
        this.attachedIdol = null;          // Currently hooked idol
        this.underwaterSinkingIdol = null; // Idol submerged in water (never comes up!)

        // Crane Physics State
        this.crane = {
            trolleyX: 320,      // Horizontal trolley position along top boom
            targetTrolleyX: 320,
            hoistY: 140,        // Vertical position of hook assembly
            targetHoistY: 140,
            minHoistY: 60,
            maxHoistY: 520,
            clampWidth: 54,     // Adjustable spreader bar / claw width (+ / - controls)
            targetClampWidth: 54,
            minClampWidth: 38,
            maxClampWidth: 128,
            swayAngle: 0,
            swayVel: 0,
            isHolding: false,
            isOperating: false,
            isDipping: false
        };

        // World Layout Dimensions (computed on resize)
        this.world = {
            width: 1000,
            height: 560,
            roadTopY: 380,
            roadBottomY: 520,
            roadLaneY: 450,
            pierEdgeX: 620,     // Where road ends and water begins
            waterSurfaceY: 380,
            pickupSpotX: 320    // Position where 1st idol waits for pickup
        };

        // Scenic Ghat Environments: 'lake', 'river', 'night', 'greenery', 'village'
        this.currentEnv = 'lake';

        // Floating Bonus Laddus
        this.laddus = [];

        // Dynamic Fluid & Living Atmosphere Effects
        this.birds = [];
        this.waterSparkles = [];
        this.waterMist = [];
        this.flutteringPetals = [];
        this.waterWaves = [];
        this.splashes = [];
        this.ripples = [];
        this.bubbles = [];
        this.auraSparks = [];
        this.envStars = [];
        this.fireflies = [];

        // Key/Button hold interval timers
        this.keyHoldInterval = null;
        this.activeKeys = {};

        this.initEnvironmentParticles();
    }

    preloadArchetypeImages() {
        this.archetypes.forEach(item => {
            const img = new Image();
            img.src = item.file;
            this.loadedImages[item.id] = img;
        });
    }

    init() {
        this.canvas = document.getElementById('nimarjanam-water-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        const envSelect = document.getElementById('nimarjanam-env-select');
        if (envSelect) {
            this.currentEnv = envSelect.value || 'lake';
        }

        this.initIdolQueue();
        this.initEnvironmentParticles();
        this.spawnBonusLaddus();
        this.bindControls();
        this.startTimer();
        this.startRenderLoop();
        this.updateContextActionButton();

        // Apply initial environment CSS class to section
        const screenEl = document.getElementById('screen-nimarjanam');
        if (screenEl) {
            screenEl.classList.remove('env-lake', 'env-river', 'env-night', 'env-greenery', 'env-village');
            screenEl.classList.add(`env-${this.currentEnv || 'lake'}`);
        }
    }

    startMode(context = {}) {
        this.context = context;
        this.fromMode = context.fromMode || 'direct';
        this.customIdolData = context.idolData || null;
        this.paintedCanvas = context.paintedCanvas || null;
        this.nextLevel = context.nextLevel || 2;

        if (this.customIdolData && this.customIdolData.imageSrc) {
            this.customIdolImg = new Image();
            this.customIdolImg.src = this.customIdolData.imageSrc;
        } else {
            this.customIdolImg = null;
        }

        const initialLevel = context.level || (window.progressTracker ? window.progressTracker.getNimarjanamCurrentLevel() : 1);

        // Sync environment select dropdown if changed
        const envSelect = document.getElementById('nimarjanam-env-select');
        if (envSelect) {
            this.currentEnv = envSelect.value || 'lake';
        }

        this.startLevel(initialLevel);
    }

    getLevelTimeLimit(level) {
        if (this.fromMode === 'puzzle' || this.fromMode === 'dressup') {
            return 90; // Generous festive time for single idol immersion
        }
        // Direct Section 3 (Visarjan) progression:
        // Level 1: 65, Level 2: 125, Level 3: 185, each level +60 seconds
        const lvl = Math.max(1, parseInt(level, 10) || 1);
        return 65 + (lvl - 1) * 60;
    }

    getTargetIdolsForLevel(level) {
        if (this.fromMode === 'puzzle' || this.fromMode === 'dressup') {
            return 1; // Exactly 1 single idol immersion for Section 1 or Section 2!
        }
        // Direct Section 3 (Visarjan) separate mode:
        // Level 1: 1 idol, Level 2: 2 idols, Level 3: 3 idols, Level 4: 4 idols, Level 5+: 5 idols
        const lvl = Math.max(1, parseInt(level, 10) || 1);
        return Math.min(lvl, 5);
    }

    startLevel(levelNumber) {
        this.currentLevel = Math.max(1, parseInt(levelNumber, 10) || 1);
        this.levelTimeLimit = this.getLevelTimeLimit(this.currentLevel);
        this.timerSeconds = this.levelTimeLimit;
        this.targetIdolsForLevel = this.getTargetIdolsForLevel(this.currentLevel);
        this.idolsImmersedInLevel = 0;
        this.score = 0;
        this.laddusCount = 0;
        this.isLevelCompleted = false;
        this.isTimeUp = false;

        this.hideAllModals();
        this.updateHud();
        this.startTimer();

        this.resizeCanvas();
        this.initIdolQueue();
        this.initEnvironmentParticles();
        this.spawnBonusLaddus();
        this.resetToChariot();

        if (this.fromMode === 'puzzle') {
            this.showFloatingScore('🧩 Immersing Your Created Ganesha! (1 Idol)', this.world.width * 0.5, this.world.height * 0.35);
        } else if (this.fromMode === 'dressup') {
            this.showFloatingScore('🎨 Immersing Your Painted Ganesha Murti! (1 Idol)', this.world.width * 0.5, this.world.height * 0.35);
        } else {
            this.showFloatingScore(`🏆 Level ${this.currentLevel} Started! (${this.targetIdolsForLevel} Idols • Time: ${this.levelTimeLimit}s)`, this.world.width * 0.5, this.world.height * 0.35);
        }
    }

    updateHud() {
        const scoreEl = document.getElementById('nimarjanam-score-val');
        if (scoreEl) scoreEl.textContent = this.score;

        const ladduEl = document.getElementById('nimarjanam-laddu-val');
        if (ladduEl) ladduEl.textContent = this.laddusCount;

        const levelEl = document.getElementById('nimarjanam-level-val');
        if (levelEl) levelEl.textContent = this.currentLevel;

        const idolsEl = document.getElementById('nimarjanam-idols-val');
        if (idolsEl) idolsEl.textContent = `${this.idolsImmersedInLevel} / ${this.targetIdolsForLevel}`;

        this.updateTimerDisplay();
    }

    formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(s / 60);
        const remSecs = s % 60;
        const mm = mins < 10 ? '0' + mins : mins;
        const ss = remSecs < 10 ? '0' + remSecs : remSecs;
        return `${mm}:${ss}`;
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('nimarjanam-timer-val');
        const timerSecEl = document.getElementById('nimarjanam-timer-sec');
        const timerBadge = document.getElementById('hud-timer-badge');

        if (timerEl) timerEl.textContent = this.formatTime(this.timerSeconds);
        if (timerSecEl) timerSecEl.textContent = `${this.timerSeconds}s`;

        if (timerBadge) {
            if (this.timerSeconds <= 15 && this.timerSeconds > 0) {
                timerBadge.classList.add('timer-urgent');
            } else {
                timerBadge.classList.remove('timer-urgent');
            }
        }
    }

    setEnvironment(envKey) {
        this.currentEnv = envKey || 'lake';
        const envSelect = document.getElementById('nimarjanam-env-select');
        if (envSelect && envSelect.value !== this.currentEnv) {
            envSelect.value = this.currentEnv;
        }

        // Sync CSS environment class on the section element for CSS-animated background
        const screenEl = document.getElementById('screen-nimarjanam');
        if (screenEl) {
            screenEl.classList.remove('env-lake', 'env-river', 'env-night', 'env-greenery', 'env-village');
            screenEl.classList.add(`env-${this.currentEnv}`);
        }

        this.initEnvironmentParticles();

        if (window.sacredAudio) {
            window.sacredAudio.playTempleBell(880, 1.2);
        }

        const envTitles = {
            lake: '🌊 Mystic Lake Waterfall',
            river: '🏞️ Flowing Holy River',
            night: '🌕 Full Moon Night',
            greenery: '🌴 Lush Greenery',
            village: '🛕 Temple Ghat'
        };

        this.showFloatingScore(envTitles[this.currentEnv] || '🌊 Ghat Changed', this.world.width * 0.5, this.world.height * 0.35);
    }

    initEnvironmentParticles() {
        this.birds = [];
        this.waterSparkles = [];
        this.waterMist = [];
        this.flutteringPetals = [];
        this.envStars = [];
        this.fireflies = [];

        const w = (this.world && this.world.width) ? this.world.width : 1000;
        const h = (this.world && this.world.height) ? this.world.height : 560;
        const pierX = (this.world && this.world.pierEdgeX) ? this.world.pierEdgeX : 620;
        const waterY = (this.world && this.world.waterSurfaceY) ? this.world.waterSurfaceY : 380;
        const waterW = w - pierX;

        // 1. FLOCK OF REALISTIC RIVER BIRDS IN NATURAL 2D FLIGHT
        // High sky V-flock: 5 graceful river swallows/terns drifting towards sunset
        for (let i = 0; i < 5; i++) {
            this.birds.push({
                x: (w * 0.30) - (i * 30),
                y: 36 + (i % 3) * 12 + (Math.random() - 0.5) * 4,
                vx: 1.35 + (i * 0.04),
                vy: (Math.random() - 0.5) * 0.04,
                heading: 1,
                size: 13 + (i % 3) * 2,
                wingSpan: 20 + (i % 3) * 3,
                wingPhase: i * 0.55,
                wingSpeed: 0.28 + Math.random() * 0.05,
                depth: 0.65,
                isGliding: false,
                modeTimer: i * 16,
                flapDuration: 90 + (i * 10),
                glideDuration: 60 + (i * 10)
            });
        }

        // Solitary soaring bird (River eagle / Brahminy kite gliding high)
        this.birds.push({
            x: w * 0.70,
            y: 52,
            vx: 0.88,
            vy: 0.015,
            heading: 1,
            size: 22,
            wingSpan: 34,
            wingPhase: 0,
            wingSpeed: 0.16,
            depth: 0.85,
            isGliding: true,
            modeTimer: 0,
            flapDuration: 40,
            glideDuration: 220
        });

        // 2 river swallows flying across from right to left (downstream corridor)
        for (let i = 0; i < 2; i++) {
            this.birds.push({
                x: w * 0.88 + (i * 70),
                y: 105 + (i * 20),
                vx: -1.75 - (i * 0.2),
                vy: (Math.random() - 0.5) * 0.06,
                heading: -1,
                size: 12,
                wingSpan: 18,
                wingPhase: i * 0.8,
                wingSpeed: 0.34,
                depth: 0.58,
                isGliding: false,
                modeTimer: i * 22,
                flapDuration: 75,
                glideDuration: 50
            });
        }

        // 2. WATER SPARKLES ACROSS THE RIVER SURFACE & SUNSET TRAIL
        for (let i = 0; i < 60; i++) {
            const inFarRiver = (i < 30);
            const sx = inFarRiver
                ? (w * 0.50 + Math.random() * (w * 0.48))
                : (pierX + 15 + Math.random() * (waterW - 30));
            const sy = inFarRiver
                ? (h * 0.42 + Math.random() * (waterY - h * 0.42))
                : (waterY + 8 + Math.random() * (h - waterY - 18));

            this.waterSparkles.push({
                x: sx,
                y: sy,
                inFarRiver: inFarRiver,
                phase: Math.random() * Math.PI * 2,
                speed: 0.05 + Math.random() * 0.08,
                size: inFarRiver ? (0.8 + Math.random() * 1.3) : (1.3 + Math.random() * 2.2),
                vx: -0.45 - Math.random() * 0.35
            });
        }

        // 3. FLOATING DIYAS & GARLANDS
        this.initFloatingLamps();

        // 4. SOFT DRIFTING RIVER MIST / VAPOR
        for (let i = 0; i < 8; i++) {
            this.waterMist.push({
                x: w * 0.50 + Math.random() * (w * 0.48),
                y: (h * 0.44) + Math.random() * (h * 0.38),
                vx: -0.22 - Math.random() * 0.16,
                radius: 35 + Math.random() * 50,
                alpha: 0.06 + Math.random() * 0.06,
                phase: Math.random() * Math.PI * 2
            });
        }

        // 5. NATURAL SACRED FLOWER PETALS (Bobbing on river current)
        const petalColors = ['#ff6d00', '#ff9100', '#ffd600', '#f48fb1', '#ff3d00'];
        for (let i = 0; i < 18; i++) {
            this.flutteringPetals.push({
                x: pierX + 10 + Math.random() * (waterW - 20),
                y: waterY - 8 + Math.random() * (h - waterY + 8),
                vx: -0.42 - Math.random() * 0.30,
                vy: 0.04 + Math.random() * 0.08,
                size: 2.8 + Math.random() * 2.6,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: 0.02 + Math.random() * 0.03,
                color: petalColors[i % petalColors.length],
                alpha: 0.75 + Math.random() * 0.25
            });
        }

        // 6. STARS & FIREFLIES FOR NIGHT
        for (let i = 0; i < 90; i++) {
            this.envStars.push({
                x: Math.random() * w,
                y: Math.random() * (waterY * 0.88),
                size: 0.8 + Math.random() * 2.2,
                alpha: 0.2 + Math.random() * 0.8,
                twinkleSpeed: 0.02 + Math.random() * 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
        for (let i = 0; i < 22; i++) {
            this.fireflies.push({
                x: pierX + Math.random() * waterW,
                y: waterY - 120 + Math.random() * 180,
                baseX: pierX + Math.random() * waterW,
                baseY: waterY - 60 + Math.random() * 120,
                radius: 1.5 + Math.random() * 2.2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.025 + Math.random() * 0.035
            });
        }
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const w = this.canvas.width = rect.width || 1000;
        const h = this.canvas.height = rect.height || 560;

        this.world.width = w;
        this.world.height = h;
        this.world.roadTopY = h * 0.67;
        this.world.roadBottomY = h * 0.95;
        this.world.roadLaneY = (this.world.roadTopY + this.world.roadBottomY) / 2;
        this.world.pierEdgeX = w * 0.62;
        this.world.waterSurfaceY = h * 0.68;
        this.world.pickupSpotX = w * 0.32;

        this.crane.minHoistY = h * 0.10;
        this.crane.maxHoistY = h * 0.92;

        if (!this.attachedIdol && !this.crane.isOperating) {
            this.crane.trolleyX = this.crane.targetTrolleyX = this.world.pickupSpotX;
            this.crane.hoistY = this.crane.targetHoistY = h * 0.28;
        }

        this.updateIdolQueuePositions();
    }

    initIdolQueue() {
        this.idolQueue = [];

        // When coming from Section 1 (Puzzle) or Section 2 (Coloring), only spawn 1 single idol!
        if (this.fromMode === 'puzzle' || this.fromMode === 'dressup') {
            let arch = null;
            if (this.customIdolData) {
                arch = {
                    id: 'custom_created',
                    name: this.customIdolData.archetypeName || this.customIdolData.title || 'Sacred Ganesha',
                    title: this.customIdolData.archetypeName || this.customIdolData.title || 'Sacred Ganesha',
                    width: 104,
                    height: 126,
                    gripWidth: 98,
                    imageSrc: this.customIdolData.imageSrc
                };
            } else {
                const archIndex = (this.currentLevel - 1) % this.archetypes.length;
                arch = this.archetypes[archIndex];
            }

            this.idolQueue.push({
                index: 0,
                archetype: arch,
                x: this.world.pickupSpotX,
                targetX: this.world.pickupSpotX,
                y: this.world.roadTopY - 45,
                width: arch.width || 104,
                height: arch.height || 126,
                gripWidth: arch.gripWidth || 98,
                isPicked: false,
                isImmersed: false,
                opacity: 1.0,
                customCanvas: (this.fromMode === 'dressup' && this.paintedCanvas) ? this.paintedCanvas : null,
                customImageSrc: (arch && arch.imageSrc) ? arch.imageSrc : null
            });
            return;
        }

        // Section 3 (Visarjan) separate mode — continuous multi-idol queue as before:
        const queueCount = 4;
        for (let i = 0; i < queueCount; i++) {
            const archIndex = (this.currentLevel - 1 + i) % this.archetypes.length;
            const arch = this.archetypes[archIndex];
            const idolW = arch.width || 96;
            const idolH = arch.height || 118;
            const gripW = arch.gripWidth || (idolW - 4);
            this.idolQueue.push({
                index: i,
                archetype: arch,
                x: this.world.pickupSpotX - (i * 125),
                targetX: this.world.pickupSpotX - (i * 125),
                y: this.world.roadTopY - 45,
                width: idolW,
                height: idolH,
                gripWidth: gripW,
                isPicked: false,
                isImmersed: false,
                opacity: 1.0
            });
        }
    }

    updateIdolQueuePositions() {
        this.idolQueue.forEach((idol, idx) => {
            if (!idol.isPicked) {
                idol.targetX = this.world.pickupSpotX - (idx * 125);
                idol.y = this.world.roadTopY - 45;
            }
        });
    }

    spawnBonusLaddus() {
        this.laddus = [
            { x: this.world.width * 0.42, y: this.world.height * 0.28, collected: false, sparkle: 0 },
            { x: this.world.width * 0.54, y: this.world.height * 0.35, collected: false, sparkle: 1.5 },
            { x: this.world.width * 0.74, y: this.world.height * 0.30, collected: false, sparkle: 3.0 }
        ];
    }

    initFloatingLamps() {
        this.floatingDiyas = [];
        this.floatingGarlands = [];
        const waterW = this.world.width - this.world.pierEdgeX;

        for (let i = 0; i < 8; i++) {
            this.floatingDiyas.push({
                x: this.world.pierEdgeX + 40 + Math.random() * (waterW - 80),
                y: this.world.waterSurfaceY + 20 + Math.random() * 90,
                vx: -0.15 - Math.random() * 0.2,
                flamePhase: Math.random() * Math.PI * 2,
                size: 9 + Math.random() * 4
            });
        }

        for (let i = 0; i < 6; i++) {
            this.floatingGarlands.push({
                x: this.world.pierEdgeX + 30 + Math.random() * (waterW - 60),
                y: this.world.waterSurfaceY + 30 + Math.random() * 80,
                vx: -0.2 - Math.random() * 0.25,
                angle: Math.random() * Math.PI * 2,
                vAngle: 0.01
            });
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            if (this.isLevelCompleted || this.isTimeUp) return;

            if (this.timerSeconds > 0) {
                this.timerSeconds--;
                this.updateTimerDisplay();

                if (this.timerSeconds <= 5 && this.timerSeconds > 0) {
                    this.playSound('bell');
                }
            } else {
                this.handleTimeUp();
            }
        }, 1000);
    }

    handleTimeUp() {
        if (this.isTimeUp || this.isLevelCompleted) return;
        this.isTimeUp = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const timerBadge = document.getElementById('hud-timer-badge');
        if (timerBadge) timerBadge.classList.remove('timer-urgent');

        if (window.sacredAudio && window.sacredAudio.playTimesUp) {
            window.sacredAudio.playTimesUp();
        }

        this.showTimeoutModal();
    }

    showTimeoutModal() {
        const modal = document.getElementById('nimarjanam-timeout-modal');
        const idolsStat = document.getElementById('timeoutIdolsStat');
        const scoreStat = document.getElementById('timeoutScoreStat');
        const retryBtn = document.getElementById('timeoutBtnRetry');

        if (idolsStat) idolsStat.textContent = `${this.idolsImmersedInLevel} / ${this.targetIdolsForLevel}`;
        if (scoreStat) scoreStat.textContent = `${this.score} Pts`;

        if (retryBtn) {
            retryBtn.onclick = () => {
                this.startLevel(this.currentLevel);
            };
        }

        const mapBtn = document.getElementById('timeoutBtnMap');
        if (mapBtn) {
            mapBtn.onclick = () => {
                if (modal) {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                }
                window.mainApp.openLevelSelectorModal('nimarjanam');
            };
        }

        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    bindControls() {
        // Adjustable Crane Grip (+ / - buttons on top-left HUD)
        this.bindContinuousButton('btn-zoom-in', () => this.adjustCraneClampWidth(2.5));
        this.bindContinuousButton('btn-zoom-out', () => this.adjustCraneClampWidth(-2.5));

        const zoomIn = document.getElementById('btn-zoom-in');
        const zoomOut = document.getElementById('btn-zoom-out');
        if (zoomIn) zoomIn.onclick = () => this.adjustCraneClampWidth(6);
        if (zoomOut) zoomOut.onclick = () => this.adjustCraneClampWidth(-6);

        // Orange Triangular Controls
        this.bindContinuousButton('btn-crane-left', () => this.moveTrolley(-16));
        this.bindContinuousButton('btn-crane-right', () => this.moveTrolley(16));
        this.bindContinuousButton('btn-crane-up', () => this.moveHoist(-16));
        this.bindContinuousButton('btn-crane-down', () => this.moveHoist(16));

        // Context Action Button
        const contextBtn = document.getElementById('crane-context-action-btn');
        if (contextBtn) contextBtn.onclick = () => this.handleContextActionClick();

        // Auto Immersion button
        const autoBtn = document.getElementById('crane-auto-btn');
        if (autoBtn) autoBtn.onclick = () => this.triggerAutoVisarjan();

        // Next Idol button
        const nextBtn = document.getElementById('nimarjanam-next-btn');
        if (nextBtn) nextBtn.onclick = () => this.advanceToNextIdol();

        // Scenic Ghat Environment Selector
        const envSelect = document.getElementById('nimarjanam-env-select');
        if (envSelect) {
            envSelect.value = this.currentEnv || 'lake';
            envSelect.onchange = (e) => this.setEnvironment(e.target.value);
        }

        // Keyboard bindings
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    bindContinuousButton(btnId, actionFn) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        let interval = null;

        const start = (e) => {
            if (e) e.preventDefault();
            btn.classList.add('active');
            actionFn();
            if (interval) clearInterval(interval);
            interval = setInterval(actionFn, 35);
        };

        const stop = (e) => {
            if (e) e.preventDefault();
            btn.classList.remove('active');
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', stop);
        btn.addEventListener('mouseleave', stop);
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', stop);
        btn.addEventListener('touchcancel', stop);
    }

    handleKeyDown(e) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyQ', 'KeyE', 'Minus', 'Equal', 'NumpadSubtract', 'NumpadAdd', 'BracketLeft', 'BracketRight'].includes(e.code)) {
            e.preventDefault();
        }
        this.activeKeys[e.code] = true;
    }

    handleKeyUp(e) {
        this.activeKeys[e.code] = false;
    }

    processKeyboardInputs() {
        if (this.activeKeys['ArrowLeft'] || this.activeKeys['KeyA']) {
            this.moveTrolley(-12);
        }
        if (this.activeKeys['ArrowRight'] || this.activeKeys['KeyD']) {
            this.moveTrolley(12);
        }
        if (this.activeKeys['ArrowUp'] || this.activeKeys['KeyW']) {
            this.moveHoist(-12);
        }
        if (this.activeKeys['ArrowDown'] || this.activeKeys['KeyS']) {
            this.moveHoist(12);
        }
        // Adjust Crane Claw Width via Keyboard (+ / -, Q / E, [ / ])
        if (this.activeKeys['KeyQ'] || this.activeKeys['Minus'] || this.activeKeys['NumpadSubtract'] || this.activeKeys['BracketLeft']) {
            this.adjustCraneClampWidth(-2.0);
        }
        if (this.activeKeys['KeyE'] || this.activeKeys['Equal'] || this.activeKeys['NumpadAdd'] || this.activeKeys['BracketRight']) {
            this.adjustCraneClampWidth(2.0);
        }
        if (this.activeKeys['Space']) {
            this.handleContextActionClick();
        }
    }

    adjustCraneClampWidth(delta) {
        this.crane.targetClampWidth = Math.max(this.crane.minClampWidth, Math.min(this.crane.maxClampWidth, this.crane.targetClampWidth + delta));
        
        const gripEl = document.getElementById('crane-grip-val');
        if (gripEl) {
            gripEl.textContent = `${Math.round(this.crane.targetClampWidth)}px`;
        }
        this.updateContextActionButton();
    }

    adjustZoom(delta) {
        this.zoomScale = Math.max(0.8, Math.min(1.4, this.zoomScale + delta));
        this.showFloatingScore(`🔍 Zoom: ${this.zoomScale.toFixed(1)}x`, this.world.width / 2, 70);
    }

    moveTrolley(delta) {
        this.crane.isOperating = true;
        this.crane.targetTrolleyX = Math.max(this.world.width * 0.08, Math.min(this.world.width * 0.90, this.crane.targetTrolleyX + delta));
        this.crane.swayVel += (delta > 0 ? 0.04 : -0.04);
        this.updateContextActionButton();
    }

    moveHoist(delta) {
        this.crane.isOperating = true;
        this.crane.targetHoistY = Math.max(this.crane.minHoistY, Math.min(this.crane.maxHoistY, this.crane.targetHoistY + delta));
        this.updateContextActionButton();
    }

    handleContextActionClick() {
        // State 1: Pick up idol from road
        if (!this.crane.isHolding && this.idolQueue.length > 0) {
            const firstIdol = this.idolQueue[0];
            const targetGrip = firstIdol.gripWidth || firstIdol.width;
            const sizeDiff = Math.abs(this.crane.clampWidth - targetGrip);

            if (sizeDiff > 14) {
                const hint = this.crane.clampWidth < targetGrip - 14 
                    ? '➕ Increase Crane Width (+) !' 
                    : '➖ Decrease Crane Width (−) !';
                this.showFloatingScore(hint, firstIdol.x + firstIdol.width / 2, firstIdol.y - 40);
                this.playSound('click');

                const btnToPulse = this.crane.clampWidth < targetGrip ? document.getElementById('btn-zoom-in') : document.getElementById('btn-zoom-out');
                if (btnToPulse) {
                    btnToPulse.classList.add('pulse-glow');
                    setTimeout(() => btnToPulse.classList.remove('pulse-glow'), 700);
                }
                return;
            }

            this.crane.targetTrolleyX = firstIdol.targetX + firstIdol.width / 2;
            this.crane.targetHoistY = firstIdol.y - 15;
            setTimeout(() => {
                this.attachIdolToCrane(firstIdol);
                this.crane.targetHoistY = this.world.height * 0.20;
            }, 350);
            return;
        }

        // State 2: Carry over water
        if (this.crane.isHolding && this.crane.trolleyX < this.world.pierEdgeX + 20) {
            this.crane.targetHoistY = this.world.height * 0.20;
            this.crane.targetTrolleyX = this.world.pierEdgeX + 110;
            return;
        }

        // State 3: Perform Sacred Visarjan Immersion
        if (this.crane.isHolding && this.crane.trolleyX >= this.world.pierEdgeX + 20) {
            this.performVisarjanImmersion();
            return;
        }

        // State 4: Next Idol
        const banner = document.getElementById('nimarjanam-chant-banner');
        if (banner && banner.classList.contains('active')) {
            this.advanceToNextIdol();
        }
    }

    updateContextActionButton() {
        const btn = document.getElementById('crane-context-action-btn');
        const cue = document.getElementById('crane-instruction-text');
        if (!btn || !cue) return;

        if (!this.crane.isHolding) {
            if (this.idolQueue.length > 0) {
                const firstIdol = this.idolQueue[0];
                const targetGrip = firstIdol.gripWidth || firstIdol.width;
                const sizeDiff = Math.abs(this.crane.clampWidth - targetGrip);
                if (sizeDiff > 14) {
                    btn.innerHTML = `🔧 Adjust Claw Size (+ / −)`;
                    cue.innerHTML = `⚠️ <strong>Crane claw size mismatch!</strong> Use <strong>(+) / (−)</strong> or <strong>Q / E</strong> on keyboard to fit the idol!`;
                } else {
                    btn.innerHTML = `🪝 Pick Up Idol (+25 Pts)`;
                    cue.innerHTML = `✨ <strong>Size matched!</strong> Press <strong>▼</strong> (Down) or click <strong>Pick Up Idol</strong>!`;
                }
            } else {
                btn.innerHTML = `🪝 Pick Up Idol (+25 Pts)`;
                cue.innerHTML = `🎮 Use <strong>◀ ▶</strong> to move crane or click <strong>Pick Up Idol</strong>!`;
            }
        } else if (this.crane.trolleyX < this.world.pierEdgeX + 20) {
            btn.innerHTML = `▶️ Carry to Water`;
            cue.innerHTML = `✨ <strong>Idol lifted!</strong> Press <strong>▶</strong> (Right) to move towards holy water!`;
        } else if (!this.crane.isDipping) {
            btn.innerHTML = `🌊 Holy Immersion (+100 Pts)`;
            cue.innerHTML = `🌊 <strong>Reached holy ghat!</strong> Press <strong>▼</strong> (Down) or click <strong>Holy Immersion</strong>!`;
        } else {
            btn.innerHTML = `🙏 Immersion in progress...`;
            cue.innerHTML = `✨ <strong>Om Gam Ganapataye Namaha!</strong> Sacred holy bath in progress...`;
        }
    }

    updatePhysics() {
        // Fast, smooth crane trolley & hoist response
        const dx = this.crane.targetTrolleyX - this.crane.trolleyX;
        this.crane.trolleyX += dx * 0.22;

        const dy = this.crane.targetHoistY - this.crane.hoistY;
        this.crane.hoistY += dy * 0.22;

        // Smoothly animate clamp width (+ / - response)
        const dW = this.crane.targetClampWidth - this.crane.clampWidth;
        this.crane.clampWidth += dW * 0.24;

        // Pendulum sway damping
        this.crane.swayAngle += this.crane.swayVel;
        this.crane.swayVel += -this.crane.swayAngle * 0.09;
        this.crane.swayVel *= 0.90;

        // Update idols on road queue (smooth slide forward)
        this.idolQueue.forEach(idol => {
            if (!idol.isPicked) {
                idol.x += (idol.targetX - idol.x) * 0.14;
            }
        });

        // Update submerged dissolving idol in water (sinks down forever!)
        if (this.underwaterSinkingIdol) {
            this.underwaterSinkingIdol.y += 0.8; // sinks down
            this.underwaterSinkingIdol.opacity -= 0.015; // dissolves into water
            if (this.underwaterSinkingIdol.opacity <= 0) {
                this.underwaterSinkingIdol = null;
            }
        }

        // Check if clamps can pick the 1st idol in the queue (Requires accurate position AND matching clamp width!)
        if (!this.crane.isHolding && this.idolQueue.length > 0 && !this.crane.isDipping) {
            const firstIdol = this.idolQueue[0];
            const clampX = this.crane.trolleyX;
            const clampY = this.crane.hoistY + 45;

            const idolTopX = firstIdol.x + firstIdol.width / 2;
            const idolTopY = firstIdol.y + 20;

            const distX = Math.abs(clampX - idolTopX);
            const distY = Math.abs(clampY - idolTopY);
            const targetGrip = firstIdol.gripWidth || firstIdol.width;
            const sizeDiff = Math.abs(this.crane.clampWidth - targetGrip);

            if (distX < 34 && distY < 48 && !firstIdol.isPicked) {
                if (sizeDiff <= 14) {
                    // Perfect claw size match! Attach and lift idol
                    this.attachIdolToCrane(firstIdol);
                } else {
                    // Lowered over idol with incorrect claw size -> Guide the player!
                    if (!this.lastGripHintTime || Date.now() - this.lastGripHintTime > 2000) {
                        this.lastGripHintTime = Date.now();
                        const hint = this.crane.clampWidth < targetGrip - 14 
                            ? '➕ Increase Crane Width (+) !' 
                            : '➖ Decrease Crane Width (−) !';
                        this.showFloatingScore(hint, idolTopX, idolTopY - 45);
                        this.playSound('click');

                        const btnToPulse = this.crane.clampWidth < targetGrip ? document.getElementById('btn-zoom-in') : document.getElementById('btn-zoom-out');
                        if (btnToPulse) {
                            btnToPulse.classList.add('pulse-glow');
                            setTimeout(() => btnToPulse.classList.remove('pulse-glow'), 700);
                        }
                    }
                }
            }
        }

        // If holding idol, sync idol position with crane hook
        if (this.crane.isHolding && this.attachedIdol) {
            const hookX = this.crane.trolleyX + Math.sin(this.crane.swayAngle) * 30;
            const hookY = this.crane.hoistY + 35;

            this.attachedIdol.x = hookX - this.attachedIdol.width / 2;
            this.attachedIdol.y = hookY;

            // Check if idol is over water and dipping/immersing
            if (this.crane.trolleyX > this.world.pierEdgeX + 20) {
                const idolBottomY = this.attachedIdol.y + this.attachedIdol.height;
                if (idolBottomY >= this.world.waterSurfaceY + 5) {
                    this.handleWaterImmersionPhysics(idolBottomY);
                }
            }
        }

        // Check laddu collection
        this.checkLadduCollisions();

        // Update fluid particles
        this.updateParticles();
    }

    attachIdolToCrane(idol) {
        if (this.crane.isHolding) return;
        this.crane.isHolding = true;
        idol.isPicked = true;
        this.attachedIdol = idol;

        this.addScore(25, '🪝 Idol Hooked & Lifted! +25');
        this.playSound('snap');
        this.updateContextActionButton();
    }

    handleWaterImmersionPhysics(idolBottomY) {
        const submersionDepth = idolBottomY - this.world.waterSurfaceY;

        // Spawn splashes & ripples continuously
        if (Math.random() < 0.5) {
            this.spawnWaterSplash(this.crane.trolleyX, this.world.waterSurfaceY);
            this.spawnRipple(this.crane.trolleyX, this.world.waterSurfaceY);
            this.spawnBubble(this.crane.trolleyX, this.world.waterSurfaceY + submersionDepth * 0.6);
        }

        // Trigger Visarjan immersion
        if (submersionDepth >= 22 && !this.crane.isDipping && this.attachedIdol) {
            this.performVisarjanImmersion();
        }
    }

    performVisarjanImmersion() {
        if (!this.attachedIdol || this.crane.isDipping) return;
        this.crane.isDipping = true;

        const targetX = this.world.pierEdgeX + 110;
        this.crane.targetTrolleyX = targetX;
        this.updateContextActionButton();

        const idolToImmerse = this.attachedIdol;

        // Step 1: Lower idol into holy water
        this.showFloatingScore('🌊 Lowering into Holy Waters...', targetX, this.world.waterSurfaceY - 60);
        this.crane.targetHoistY = this.world.waterSurfaceY - 10;
        this.playSound('splash');
        this.spawnWaterSplash(targetX, this.world.waterSurfaceY);

        // Step 2: Sacred Dip in water
        setTimeout(() => {
            this.showFloatingScore('🌊 Sacred Holy Immersion (Visarjan)', targetX, this.world.waterSurfaceY - 60);
            this.crane.targetHoistY = this.world.waterSurfaceY + 35;
            this.playSound('splash');
            this.spawnWaterSplash(targetX, this.world.waterSurfaceY);
            this.spawnRipple(targetX, this.world.waterSurfaceY);
        }, 800);

        // Step 3: RELEASE IDOL IN WATER - IDOL SINKS DOWN, CRANE DETACHES & HOISTS UP EMPTY!
        setTimeout(() => {
            // DETACH IDOL COMPLETELY IN WATER (IDOL WILL NEVER COME UP!)
            this.attachedIdol = null;
            this.crane.isHolding = false;
            this.crane.isDipping = false;

            // Put idol into underwater sinking state
            this.underwaterSinkingIdol = {
                archetype: idolToImmerse.archetype,
                x: idolToImmerse.x,
                y: this.world.waterSurfaceY + 15,
                width: idolToImmerse.width,
                height: idolToImmerse.height,
                opacity: 0.85,
                customCanvas: idolToImmerse.customCanvas,
                customImageSrc: idolToImmerse.customImageSrc
            };

            // Remove this completed idol from the road queue
            this.idolQueue.shift();
            this.idolsImmersedInLevel++;

            // Update idols counter in HUD
            const idolsEl = document.getElementById('nimarjanam-idols-val');
            if (idolsEl) idolsEl.textContent = `${this.idolsImmersedInLevel} / ${this.targetIdolsForLevel}`;

            // Only add extra idols if we are in Section 3 direct mode (separate Visarjan):
            if (this.fromMode !== 'puzzle' && this.fromMode !== 'dressup') {
                const nextArchIndex = (this.currentLevel + this.idolsImmersedInLevel + 2) % this.archetypes.length;
                const nextArch = this.archetypes[nextArchIndex];
                this.idolQueue.push({
                    index: this.idolQueue.length,
                    archetype: nextArch,
                    x: this.world.pickupSpotX - (3 * 125),
                    targetX: this.world.pickupSpotX - (3 * 125),
                    y: this.world.roadTopY - 45,
                    width: 96,
                    height: 118,
                    isPicked: false,
                    isImmersed: false,
                    opacity: 1.0
                });
            }

            // Slide remaining idols on the road forward to the pickup station
            this.updateIdolQueuePositions();

            // Mega splash, shankha blast, sound effects, celebration score
            this.spawnMegaImmersionCelebration(targetX, this.world.waterSurfaceY);
            this.addScore(100, '🌊 Holy Immersion Complete! +100');
            this.playSound('shankha');
            this.playSound('splash');

            if (window.progressTracker) {
                window.progressTracker.recordNimarjanamCompletion(this.currentLevel);
            }

            // CHECK IF TARGET IDOLS FOR THIS LEVEL ARE ALL IMMERSED:
            if (this.idolsImmersedInLevel >= this.targetIdolsForLevel) {
                // ALL TARGET IDOLS COMPLETED! LEVEL WON!
                this.isLevelCompleted = true;
                if (this.timerInterval) clearInterval(this.timerInterval);

                setTimeout(() => {
                    this.showCandyCrushVictoryModal();
                }, 1100);
            } else {
                // Intermediate idol completed: Show brief notification
                this.showCelebrationModal();
            }

            // Step 4: ONLY THE EMPTY CRANE HOOK RISES UP OUT OF THE WATER!
            this.showFloatingScore('⬆️ Crane Hook Rising...', targetX, this.world.waterSurfaceY - 90);
            this.crane.targetHoistY = this.world.height * 0.16;

            // Step 5: EMPTY CRANE TRAVELS BACK TO ROAD TO PICK NEXT IDOL
            setTimeout(() => {
                this.crane.targetTrolleyX = this.world.pickupSpotX;
                this.crane.targetHoistY = this.world.height * 0.28;
                this.updateContextActionButton();
                this.showFloatingScore('✨ Next Idol Ready!', this.world.pickupSpotX, this.world.roadTopY - 60);
            }, 900);

        }, 1800);
    }

    showCelebrationModal() {
        const banner = document.getElementById('nimarjanam-chant-banner');
        if (banner) {
            banner.classList.add('active');
            setTimeout(() => {
                if (banner.classList.contains('active')) banner.classList.remove('active');
            }, 2500);
        }
    }

    showCandyCrushVictoryModal() {
        const modal = document.getElementById('nimarjanam-candy-modal');
        if (!modal) return;

        // Fanfare & conch blast
        if (window.sacredAudio) {
            window.sacredAudio.playSuccessFanfare();
            setTimeout(() => window.sacredAudio.playShankha(2.2), 300);
        }

        // Calculate Bonuses
        const timeBonus = Math.max(0, this.timerSeconds * 10);
        const ladduBonus = this.laddusCount * 50;
        const initialScore = this.score;
        const finalScore = initialScore + timeBonus;

        // Star calculation:
        // 1 Star: Completed level
        // 2 Stars: Good time remaining (>= 20%) or laddu collected
        // 3 Stars: Great time remaining (>= 40%)
        const timePct = this.timerSeconds / this.levelTimeLimit;
        let stars = 1;
        if (timePct >= 0.20 || this.laddusCount >= 1) stars = 2;
        if (timePct >= 0.40) stars = 3;

        // Update Modal DOM
        const titleEl = document.getElementById('candy-level-title');
        const idolsStatEl = document.getElementById('candyIdolsStat');
        const timeBonusStatEl = document.getElementById('candyTimeBonusStat');
        const laddusStatEl = document.getElementById('candyLaddusStat');
        const totalScoreEl = document.getElementById('candyTotalScore');
        const highScoreEl = document.getElementById('candyHighScoreStat');
        const newBestBadge = document.getElementById('candyNewBestBadge');
        const subTitleEl = document.querySelector('.candy-level-sub');

        if (this.fromMode === 'puzzle') {
            if (titleEl) titleEl.textContent = '🧩 Puzzle Ganesha Immersion Complete!';
            if (subTitleEl) subTitleEl.textContent = 'You have successfully immersed your created Ganesha in the sacred holy waters!';
        } else if (this.fromMode === 'dressup') {
            if (titleEl) titleEl.textContent = '🎨 Painted Murti Immersion Complete!';
            if (subTitleEl) subTitleEl.textContent = 'You have successfully immersed your beautifully decorated Ganesha in the holy waters!';
        } else {
            if (titleEl) titleEl.textContent = `LEVEL ${this.currentLevel} COMPLETE!`;
            if (subTitleEl) subTitleEl.textContent = 'Ganapati Bappa Morya! Divine Immersion Complete!';
        }

        if (idolsStatEl) idolsStatEl.textContent = `${this.idolsImmersedInLevel} / ${this.targetIdolsForLevel} ✅`;
        if (timeBonusStatEl) timeBonusStatEl.textContent = `+${timeBonus} Pts (${this.timerSeconds}s left)`;
        if (laddusStatEl) laddusStatEl.textContent = `+${ladduBonus} Pts (${this.laddusCount} Laddus)`;

        // High score management
        const hsKey = `ganesh_nimarjanam_hs_lvl_${this.currentLevel}`;
        let prevBest = 0;
        try {
            prevBest = parseInt(localStorage.getItem(hsKey), 10) || 0;
        } catch(e) {}

        const isNewBest = finalScore > prevBest;
        if (isNewBest) {
            try { localStorage.setItem(hsKey, finalScore); } catch(e) {}
            if (newBestBadge) newBestBadge.style.display = 'inline-block';
            if (highScoreEl) highScoreEl.textContent = `${finalScore.toLocaleString()} Pts (New!)`;
        } else {
            if (newBestBadge) newBestBadge.style.display = 'none';
            if (highScoreEl) highScoreEl.textContent = `${prevBest.toLocaleString()} Pts`;
        }

        // Reset Star Slots
        for (let i = 1; i <= 3; i++) {
            const slot = document.getElementById(`candyStarSlot${i}`);
            if (slot) slot.classList.remove('achieved');
        }

        // Display Modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        // Rapid rolling score animation
        let rollVal = 0;
        const rollDuration = 1200;
        const rollSteps = 24;
        const stepInc = Math.max(1, Math.floor(finalScore / rollSteps));
        const rollInterval = setInterval(() => {
            rollVal = Math.min(finalScore, rollVal + stepInc);
            if (totalScoreEl) totalScoreEl.textContent = rollVal.toLocaleString();
            if (window.sacredAudio && window.sacredAudio.playScoreTick) {
                window.sacredAudio.playScoreTick();
            }
            if (rollVal >= finalScore) {
                clearInterval(rollInterval);
                if (totalScoreEl) totalScoreEl.textContent = finalScore.toLocaleString();
            }
        }, rollDuration / rollSteps);

        // Sequential Star Pop-In Animation (Candy Crush Style ⭐)
        for (let s = 1; s <= stars; s++) {
            setTimeout(() => {
                const slot = document.getElementById(`candyStarSlot${s}`);
                if (slot) {
                    slot.classList.add('achieved');
                    if (window.sacredAudio && window.sacredAudio.playStarPop) {
                        window.sacredAudio.playStarPop(s - 1);
                    }
                }
            }, 600 + (s * 380));
        }

        // Bind Action Buttons
        const nextBtn = document.getElementById('candyBtnNext');
        const replayBtn = document.getElementById('candyBtnReplay');
        const mapBtn = document.getElementById('candyBtnMap');

        if (this.fromMode === 'puzzle') {
            if (nextBtn) {
                nextBtn.textContent = `🧩 Next Puzzle (${this.nextLevel}) ▶`;
                nextBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    window.mainApp.switchMode('puzzle', { level: this.nextLevel });
                };
            }
            if (replayBtn) {
                replayBtn.textContent = '🔄 Replay Immersion';
                replayBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    this.startLevel(this.currentLevel);
                };
            }
            if (mapBtn) {
                mapBtn.textContent = '🗺️ Puzzle Road Map';
                mapBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    window.mainApp.openLevelSelectorModal('puzzle');
                };
            }
        } else if (this.fromMode === 'dressup') {
            if (nextBtn) {
                nextBtn.textContent = `🎨 Next Murti (${this.nextLevel}) ▶`;
                nextBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    window.mainApp.switchMode('dressup', { level: this.nextLevel });
                };
            }
            if (replayBtn) {
                replayBtn.textContent = '🔄 Replay Immersion';
                replayBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    this.startLevel(this.currentLevel);
                };
            }
            if (mapBtn) {
                mapBtn.textContent = '🗺️ Coloring Road Map';
                mapBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    window.mainApp.openLevelSelectorModal('dressup');
                };
            }
        } else {
            // Direct Section 3 (Visarjan) separate mode:
            if (nextBtn) {
                nextBtn.textContent = 'Next Level ▶';
                nextBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    this.startLevel(this.currentLevel + 1);
                };
            }
            if (replayBtn) {
                replayBtn.textContent = '🔄 Replay Level';
                replayBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    this.startLevel(this.currentLevel);
                };
            }
            if (mapBtn) {
                mapBtn.textContent = '🗺️ Visarjan Road Map';
                mapBtn.onclick = () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    window.mainApp.openLevelSelectorModal('nimarjanam');
                };
            }
        }
    }

    hideAllModals() {
        const candyModal = document.getElementById('nimarjanam-candy-modal');
        const timeoutModal = document.getElementById('nimarjanam-timeout-modal');
        const banner = document.getElementById('nimarjanam-chant-banner');

        if (candyModal) {
            candyModal.classList.remove('active');
            candyModal.setAttribute('aria-hidden', 'true');
        }
        if (timeoutModal) {
            timeoutModal.classList.remove('active');
            timeoutModal.setAttribute('aria-hidden', 'true');
        }
        if (banner) {
            banner.classList.remove('active');
        }
    }

    advanceToNextIdol() {
        this.updateIdolQueuePositions();
        this.crane.targetTrolleyX = this.world.pickupSpotX;
        this.crane.targetHoistY = this.world.height * 0.28;
        this.updateContextActionButton();
    }

    resetToChariot() {
        const banner = document.getElementById('nimarjanam-chant-banner');
        if (banner) banner.classList.remove('active');

        if (this.attachedIdol) {
            this.attachedIdol.isPicked = false;
            this.attachedIdol.isImmersed = false;
            this.attachedIdol = null;
        }

        this.underwaterSinkingIdol = null;
        this.crane.isHolding = false;
        this.crane.isDipping = false;
        this.crane.targetTrolleyX = this.world.pickupSpotX;
        this.crane.targetHoistY = this.world.height * 0.28;

        this.updateIdolQueuePositions();
        this.updateContextActionButton();
    }

    triggerAutoVisarjan() {
        if (this.crane.isDipping || this.idolQueue.length === 0) return;
        this.handleContextActionClick();
    }

    checkLadduCollisions() {
        const hookX = this.crane.trolleyX;
        const hookY = this.crane.hoistY + 40;

        this.laddus.forEach(laddu => {
            if (!laddu.collected) {
                const dist = Math.hypot(hookX - laddu.x, hookY - laddu.y);
                if (dist < 42) {
                    laddu.collected = true;
                    this.laddusCount++;
                    this.addScore(50, '🟡 Laddu Collected! +50');
                    this.playSound('bell');
                    this.spawnLadduSparkles(laddu.x, laddu.y);

                    const ladduEl = document.getElementById('nimarjanam-laddu-val');
                    if (ladduEl) ladduEl.textContent = this.laddusCount;
                }
            }
        });
    }

    addScore(pts, label) {
        this.score += pts;
        const scoreEl = document.getElementById('nimarjanam-score-val');
        if (scoreEl) scoreEl.textContent = this.score;

        if (label) {
            this.showFloatingScore(label, this.crane.trolleyX, this.crane.hoistY - 30);
        }
    }

    showFloatingScore(text, x, y) {
        const container = document.getElementById('nimarjanam-floating-scores');
        if (!container) return;

        const el = document.createElement('div');
        el.className = 'floating-score-item';
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        container.appendChild(el);
        setTimeout(() => el.remove(), 1600);
    }

    playSound(type) {
        if (!window.sacredAudio) return;
        if (type === 'snap') {
            window.sacredAudio.playPieceSnap();
        } else if (type === 'splash') {
            window.sacredAudio.playWaterSplash();
        } else if (type === 'bell') {
            window.sacredAudio.playTempleBell(950, 1.8);
        } else if (type === 'shankha') {
            window.sacredAudio.playShankha(3.0);
            window.sacredAudio.startDholRhythm();
            setTimeout(() => window.sacredAudio.stopDholRhythm(), 6000);
        }
    }

    spawnWaterSplash(x, y) {
        for (let i = 0; i < 14; i++) {
            this.splashes.push({
                x: x + (Math.random() - 0.5) * 55,
                y: y,
                vx: (Math.random() - 0.5) * 7,
                vy: -3.5 - Math.random() * 5.5,
                radius: 2.5 + Math.random() * 4,
                alpha: 1.0,
                color: '#80d8ff'
            });
        }
    }

    spawnRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 6,
            maxRadius: 50 + Math.random() * 35,
            alpha: 0.9,
            lineWidth: 2.5
        });
    }

    spawnBubble(x, y) {
        this.bubbles.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1 - Math.random() * 2,
            radius: 2 + Math.random() * 3,
            alpha: 0.85
        });
    }

    spawnMegaImmersionCelebration(x, y) {
        // High particle count explosion
        for (let i = 0; i < 45; i++) {
            this.splashes.push({
                x: x + (Math.random() - 0.5) * 70,
                y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: -6 - Math.random() * 9,
                radius: 3 + Math.random() * 5,
                alpha: 1.0,
                color: Math.random() > 0.3 ? '#80d8ff' : '#ffd700'
            });
        }

        // Golden aura sparks
        for (let i = 0; i < 35; i++) {
            this.auraSparks.push({
                x: x + (Math.random() - 0.5) * 90,
                y: y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 5,
                vy: -2 - Math.random() * 5,
                size: 3.5 + Math.random() * 4.5,
                alpha: 1.0,
                color: '#ffe082'
            });
        }
    }

    spawnLadduSparkles(x, y) {
        for (let i = 0; i < 18; i++) {
            this.auraSparks.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 2.5 + Math.random() * 3.5,
                alpha: 1.0,
                color: '#ffd54f'
            });
        }
    }

    updateParticles() {
        const w = (this.world && this.world.width) ? this.world.width : 1000;
        const h = (this.world && this.world.height) ? this.world.height : 560;
        const pierX = (this.world && this.world.pierEdgeX) ? this.world.pierEdgeX : 620;
        const waterY = (this.world && this.world.waterSurfaceY) ? this.world.waterSurfaceY : 380;
        const waterW = w - pierX;

        // 1. Update Flying Birds (Natural 2D Flight Dynamics)
        this.birds.forEach(bird => {
            bird.x += bird.vx * bird.depth;
            bird.y += bird.vy + (bird.isGliding ? Math.sin(this.time * 1.5) * 0.12 : Math.sin(bird.wingPhase) * 0.22);

            bird.modeTimer++;
            if (bird.isGliding) {
                if (bird.modeTimer > bird.glideDuration) {
                    bird.isGliding = false;
                    bird.modeTimer = 0;
                }
            } else {
                bird.wingPhase += bird.wingSpeed;
                if (bird.modeTimer > bird.flapDuration) {
                    bird.isGliding = true;
                    bird.modeTimer = 0;
                }
            }

            // Bidirectional seamless wrapping
            if (bird.vx > 0 && bird.x > w + 60) {
                bird.x = -45 - Math.random() * 60;
                bird.y = 30 + Math.random() * (waterY * 0.42);
                bird.modeTimer = 0;
            } else if (bird.vx < 0 && bird.x < -60) {
                bird.x = w + 45 + Math.random() * 60;
                bird.y = 35 + Math.random() * (waterY * 0.42);
                bird.modeTimer = 0;
            }
        });

        // 2. Update Living Water Shimmer & Sparkles
        this.waterSparkles.forEach(sp => {
            sp.x += sp.vx;
            sp.phase += sp.speed;
            const minX = sp.inFarRiver ? (w * 0.48) : (pierX + 10);
            if (sp.x < minX) {
                sp.x = w + 15;
                sp.y = sp.inFarRiver
                    ? (h * 0.42 + Math.random() * (waterY - h * 0.42))
                    : (waterY + 8 + Math.random() * (h - waterY - 18));
            }
        });

        // 2b. Update Sacred Floating Diyas
        if (this.floatingDiyas) {
            this.floatingDiyas.forEach(d => {
                d.x += d.vx;
                d.flamePhase += 0.14;
                d.y = d.baseY + Math.sin(this.time * 2.2 + d.x * 0.03) * 3.5;
                if (d.x < pierX + 5) {
                    d.x = w + 20 + Math.random() * 40;
                    d.baseY = waterY + 20 + Math.random() * (h - waterY - 50);
                }
            });
        }

        // 2c. Update Floating Flower Garlands
        if (this.floatingGarlands) {
            this.floatingGarlands.forEach(g => {
                g.x += g.vx;
                g.angle += g.vAngle;
                if (g.x < pierX + 5) {
                    g.x = w + 25 + Math.random() * 40;
                    g.y = waterY + 25 + Math.random() * (h - waterY - 50);
                }
            });
        }

        // 3. Update Drifting River Mist
        this.waterMist.forEach(m => {
            m.x += m.vx;
            m.phase += 0.015;
            if (m.x < w * 0.46) {
                m.x = w + 35;
                m.y = (h * 0.44) + Math.random() * (h * 0.38);
            }
        });

        // 4. Update Fluttering Sacred Petals
        this.flutteringPetals.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.angle += p.rotSpeed;
            if (p.x < pierX + 5 || p.y > h) {
                p.x = pierX + 20 + Math.random() * (waterW - 30);
                p.y = waterY - 10 - Math.random() * 25;
            }
        });

        // 5. Update Water Splashes
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const p = this.splashes[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.28;
            p.alpha -= 0.024;
            if (p.alpha <= 0) this.splashes.splice(i, 1);
        }

        // 6. Update Water Concentric Ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += 1.0;
            r.alpha -= 0.016;
            if (r.alpha <= 0 || r.radius >= r.maxRadius) this.ripples.splice(i, 1);
        }

        // 7. Update Underwater Bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.x += b.vx;
            b.y += b.vy;
            b.alpha -= 0.015;
            if (b.alpha <= 0 || b.y < this.world.waterSurfaceY) this.bubbles.splice(i, 1);
        }

        // 8. Update Aura Sparks
        for (let i = this.auraSparks.length - 1; i >= 0; i--) {
            const s = this.auraSparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.02;
            if (s.alpha <= 0) this.auraSparks.splice(i, 1);
        }

        // 9. Update Stars Twinkle
        this.envStars.forEach(s => {
            s.phase += s.twinkleSpeed;
        });

        // 10. Update Fireflies
        this.fireflies.forEach(f => {
            f.phase += f.speed;
            f.x = f.baseX + Math.sin(f.phase) * 28;
            f.y = f.baseY + Math.cos(f.phase * 1.4) * 18;
            if (f.baseX < this.world.pierEdgeX + 15) {
                f.baseX = this.world.width - 15;
            }
            f.baseX -= 0.18;
        });
    }

    // =========================================================================
    // CANVAS RENDERING PIPELINE (60 FPS with Proper Depth & Water Layering)
    // =========================================================================

    startRenderLoop() {
        const loop = () => {
            this.time += 0.016; // ~60fps frame time
            this.processKeyboardInputs();
            this.updatePhysics();
            this.render();
            this.animFrameId = requestAnimationFrame(loop);
        };
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = requestAnimationFrame(loop);
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.world.width;
        const h = this.world.height;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // Apply Zoom Camera Transform
        ctx.translate(w / 2, h / 2);
        ctx.scale(this.zoomScale, this.zoomScale);
        ctx.translate(-w / 2, -h / 2);

        // 1. Draw HD Realistic Background Landscape
        this.renderBackground(ctx, w, h);

        // 2. Draw Living Flying Birds across the Sky & Mountains (Video-like Natural Life!)
        this.renderFlyingBirds(ctx, w, h);

        // 3. Draw Sacred Promenade / Ghat Sandstone Platform & VIP Stanchions
        this.renderRoadAndGhat(ctx, w, h);

        // 4. Draw Deep Water Bed (Underneath submerged idols)
        this.renderDeepWaterBed(ctx, w, h);

        // 5. Draw Submerged Dissolving Idol in Water (Under water!)
        this.renderUnderwaterSinkingIdol(ctx);

        // 6. Draw Floating Bonus Laddus
        this.renderBonusLaddus(ctx);

        // 7. Draw Idols in the Road Queue & Hanging from Crane
        this.renderIdolQueue(ctx);

        // 8. Draw Industrial Tower Crane Mechanism & Slings
        this.renderCraneMechanism(ctx, w, h);

        // 9. Draw Living Flowing River Water, Specular Caustics, Sun/Moon Sparkles & Vapor
        this.renderLivingWater(ctx, w, h);

        // 10. Draw Fluid Splashes, Concentric Ripples, Bubbles & Aura Particles
        this.renderEffectsAndParticles(ctx);

        ctx.restore();
    }

    renderBackground(ctx, w, h) {
        // Draw the photorealistic HD background artwork for the active environment
        const bg = this.envImages[this.currentEnv] || this.envImages.lake;
        if (bg && bg.complete && bg.naturalWidth > 0) {
            ctx.drawImage(bg, 0, 0, w, h);
        } else if (this.envImages.lake && this.envImages.lake.complete && this.envImages.lake.naturalWidth > 0) {
            ctx.drawImage(this.envImages.lake, 0, 0, w, h);
        } else {
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
            skyGrad.addColorStop(0, '#030818');
            skyGrad.addColorStop(0.5, '#0d1b3e');
            skyGrad.addColorStop(1, '#050c1f');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // Ambient dynamic lighting and particles on top of the realistic photo
        if (this.currentEnv === 'night') {
            // Glowing Fireflies floating over the holy river and ghat
            this.fireflies.forEach(f => {
                const glow = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.radius * 3.5);
                glow.addColorStop(0, 'rgba(255, 255, 120, 0.95)');
                glow.addColorStop(0.4, 'rgba(170, 255, 0, 0.6)');
                glow.addColorStop(1, 'rgba(100, 255, 0, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius * 3.5, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.currentEnv === 'lake') {
            // Soft glowing turquoise waterfall mist
            const sprayGrad = ctx.createRadialGradient(w * 0.82, this.world.waterSurfaceY - 40, 10, w * 0.82, this.world.waterSurfaceY - 40, 110);
            sprayGrad.addColorStop(0, 'rgba(224, 247, 250, 0.35)');
            sprayGrad.addColorStop(0.6, 'rgba(128, 222, 234, 0.15)');
            sprayGrad.addColorStop(1, 'rgba(0, 188, 212, 0)');
            ctx.fillStyle = sprayGrad;
            ctx.fillRect(w * 0.70, this.world.waterSurfaceY - 140, w * 0.30, 160);
        } else if (this.currentEnv === 'greenery') {
            // Soft morning sunbeams (God Rays)
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 210, 0.06)';
            for (let ray = 0; ray < 4; ray++) {
                ctx.beginPath();
                ctx.moveTo(w * 0.88, 0);
                ctx.lineTo(w * (0.42 + ray * 0.14), this.world.waterSurfaceY);
                ctx.lineTo(w * (0.48 + ray * 0.14), this.world.waterSurfaceY);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    renderRoadAndGhat(ctx, w, h) {
        const roadW = this.world.pierEdgeX;
        const roadTopY = this.world.roadTopY;
        const roadH = h - roadTopY;

        // 1. VIP Promenade Background / Temple Pavilion Base (Ceremonial Maroon Wall with Gold Lotus Trims)
        const pavilionGrad = ctx.createLinearGradient(0, roadTopY - 32, 0, roadTopY);
        pavilionGrad.addColorStop(0, 'rgba(55, 12, 20, 0.90)');
        pavilionGrad.addColorStop(0.5, 'rgba(85, 18, 28, 0.92)');
        pavilionGrad.addColorStop(1, 'rgba(110, 24, 36, 0.95)');
        ctx.fillStyle = pavilionGrad;
        ctx.fillRect(0, roadTopY - 32, roadW, 32);

        // Ornate Gold Molding along top & bottom of Pavilion base
        const goldMoldingGrad = ctx.createLinearGradient(0, roadTopY - 32, 0, roadTopY - 28);
        goldMoldingGrad.addColorStop(0, '#ffe082');
        goldMoldingGrad.addColorStop(0.5, '#ffd700');
        goldMoldingGrad.addColorStop(1, '#ff8f00');
        ctx.fillStyle = goldMoldingGrad;
        ctx.fillRect(0, roadTopY - 32, roadW, 3.5);

        const goldBottomGrad = ctx.createLinearGradient(0, roadTopY - 3, 0, roadTopY);
        goldBottomGrad.addColorStop(0, '#ffd700');
        goldBottomGrad.addColorStop(1, '#b26a00');
        ctx.fillStyle = goldBottomGrad;
        ctx.fillRect(0, roadTopY - 3, roadW, 2.5);

        // Ornamental golden lotus accents along pavilion wall
        ctx.fillStyle = 'rgba(255, 215, 0, 0.22)';
        for (let ax = 20; ax < roadW - 20; ax += 32) {
            ctx.beginPath();
            ctx.arc(ax, roadTopY - 12, 7, Math.PI, 0);
            ctx.fill();
        }

        // 2. VIP Brass Stanchions & Braided Crimson Velvet Ropes
        const postSpacing = 68;
        const numPosts = Math.floor(roadW / postSpacing);
        for (let i = 1; i <= numPosts; i++) {
            const px = i * postSpacing;
            const py = roadTopY - 30;

            // Soft drop shadow under stanchion base
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(px, roadTopY - 2, 7, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Flared Brass Base
            const baseGrad = ctx.createLinearGradient(px - 6, 0, px + 6, 0);
            baseGrad.addColorStop(0, '#b26a00');
            baseGrad.addColorStop(0.4, '#ffd700');
            baseGrad.addColorStop(0.7, '#fff59d');
            baseGrad.addColorStop(1, '#8c5000');
            ctx.fillStyle = baseGrad;
            ctx.fillRect(px - 5, py + 22, 10, 6);

            // Polished Brass Pole
            ctx.fillStyle = baseGrad;
            ctx.fillRect(px - 2, py + 4, 4, 20);

            // Spherical Brass Finial Top
            const finialGrad = ctx.createRadialGradient(px - 1, py + 2, 1, px, py + 3, 5);
            finialGrad.addColorStop(0, '#ffffff');
            finialGrad.addColorStop(0.4, '#ffd700');
            finialGrad.addColorStop(1, '#b26a00');
            ctx.fillStyle = finialGrad;
            ctx.beginPath();
            ctx.arc(px, py + 3, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Braided Crimson Velvet Rope with realistic natural sag
            if (i < numPosts) {
                const nextPx = (i + 1) * postSpacing;
                const midX = (px + nextPx) / 2;
                const sagY = py + 16;

                // Rope shadow
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.lineWidth = 3.0;
                ctx.beginPath();
                ctx.moveTo(px, py + 9);
                ctx.quadraticCurveTo(midX, sagY + 2, nextPx, py + 9);
                ctx.stroke();

                // Crimson braided velvet core
                ctx.strokeStyle = '#c62828';
                ctx.lineWidth = 3.0;
                ctx.beginPath();
                ctx.moveTo(px, py + 7);
                ctx.quadraticCurveTo(midX, sagY, nextPx, py + 7);
                ctx.stroke();

                // Golden highlight thread along top of rope
                ctx.strokeStyle = '#ffd54f';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px + 2, py + 6);
                ctx.quadraticCurveTo(midX, sagY - 1, nextPx - 2, py + 6);
                ctx.stroke();
            }
        }

        // 3. Sacred Ceremonial Procession Carpet / Temple Floor
        const stoneGrad = ctx.createLinearGradient(0, roadTopY, 0, h);
        stoneGrad.addColorStop(0, 'rgba(32, 24, 20, 0.65)');
        stoneGrad.addColorStop(0.4, 'rgba(24, 18, 14, 0.75)');
        stoneGrad.addColorStop(1, 'rgba(16, 12, 10, 0.85)');
        ctx.fillStyle = stoneGrad;
        ctx.fillRect(0, roadTopY, roadW, roadH);

        // Soft stone paving texture
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.06)';
        ctx.lineWidth = 1;
        const tileSize = 52;
        for (let tx = 0; tx < roadW; tx += tileSize) {
            ctx.beginPath();
            ctx.moveTo(tx, roadTopY);
            ctx.lineTo(tx, h);
            ctx.stroke();
        }

        // Sacred Golden Guide Track for Idols (Subtle glowing lotus procession path)
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, this.world.roadLaneY);
        ctx.lineTo(roadW - 20, this.world.roadLaneY);
        ctx.stroke();

        // 4. Ancient Ghat Granite Quay Edge (Seamless natural stone transition)
        const quayGrad = ctx.createLinearGradient(roadW - 18, 0, roadW, 0);
        quayGrad.addColorStop(0, 'rgba(45, 35, 28, 0.85)');
        quayGrad.addColorStop(0.5, '#4a3d32');
        quayGrad.addColorStop(0.8, '#5e4e40');
        quayGrad.addColorStop(1, '#2c221a');
        ctx.fillStyle = quayGrad;
        ctx.fillRect(roadW - 18, roadTopY, 18, roadH);

        // Golden ornamental trim on quay edge
        ctx.fillStyle = 'rgba(255, 215, 0, 0.55)';
        ctx.fillRect(roadW - 2, roadTopY, 2, roadH);

        // Drop shadow cast onto river water
        const pierShadowGrad = ctx.createLinearGradient(roadW, 0, roadW + 28, 0);
        pierShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        pierShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = pierShadowGrad;
        ctx.fillRect(roadW, this.world.waterSurfaceY, 28, h - this.world.waterSurfaceY);
    }

    renderDeepWaterBed(ctx, w, h) {
        const waterX = this.world.pierEdgeX;
        const waterW = w - waterX;
        const waterTopY = this.world.waterSurfaceY;
        const waterH = h - waterTopY;
        const t = this.time;

        // === REALISTIC RIVER / LAKE WATER BODY ===
        // Base deep water color layer with environment-specific tint
        const envColors = {
            lake:     { r0: [15, 80, 160], r1: [5, 40, 100], r2: [2, 15, 50] },
            river:    { r0: [100, 65, 20], r1: [70, 40, 10], r2: [30, 15, 5] },
            night:    { r0: [8, 25, 65],   r1: [4, 12, 40],  r2: [2, 5, 20] },
            greenery: { r0: [0, 90, 80],   r1: [0, 60, 55],  r2: [0, 20, 18] },
            village:  { r0: [90, 40, 15],  r1: [60, 25, 8],  r2: [25, 8, 3] }
        };
        const ec = envColors[this.currentEnv] || envColors.lake;

        const waterGrad = ctx.createLinearGradient(waterX, waterTopY, waterX, h);
        waterGrad.addColorStop(0, `rgba(${ec.r0.join(',')}, 0.25)`);
        waterGrad.addColorStop(0.45, `rgba(${ec.r1.join(',')}, 0.38)`);
        waterGrad.addColorStop(1, `rgba(${ec.r2.join(',')}, 0.55)`);
        ctx.fillStyle = waterGrad;
        ctx.fillRect(waterX, waterTopY, waterW, waterH);

        // === CAUSTIC LIGHT PATTERNS (underwater light dappling) ===
        ctx.save();
        ctx.globalAlpha = 0.12;
        const causticCount = 18;
        for (let ci = 0; ci < causticCount; ci++) {
            const cx = waterX + (ci / causticCount) * waterW + Math.sin(t * 0.7 + ci * 1.3) * 28;
            const cy = waterTopY + 30 + (ci * (waterH - 50) / causticCount) + Math.cos(t * 0.5 + ci * 0.9) * 18;
            const cr = 16 + Math.sin(t * 1.1 + ci) * 9;
            const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, cr);
            cg.addColorStop(0, this.currentEnv === 'night' ? 'rgba(120,190,255,1)' : 'rgba(255,248,180,1)');
            cg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.ellipse(cx, cy, cr, cr * 0.4, t * 0.2 + ci, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // === HORIZONTAL FLOW STREAKS (flowing river current) ===
        ctx.save();
        const streamCount = 8;
        for (let si = 0; si < streamCount; si++) {
            const sy = waterTopY + (si + 0.5) * (waterH / streamCount);
            const speed = (si % 3 === 0) ? 0.9 : (si % 3 === 1 ? 1.5 : 1.2);
            const flowOffset = ((t * speed * 65) % waterW);

            ctx.globalAlpha = 0.12 + (si % 2) * 0.04;
            const sg = ctx.createLinearGradient(waterX, 0, w, 0);
            sg.addColorStop(0, 'rgba(255,255,255,0)');
            sg.addColorStop(0.1, 'rgba(255,255,255,0.85)');
            sg.addColorStop(0.5, 'rgba(255,255,255,0.45)');
            sg.addColorStop(0.9, 'rgba(255,255,255,0.85)');
            sg.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.strokeStyle = sg;
            ctx.lineWidth = 1.4 + (si % 2) * 0.8;

            // Draw two offset copies for seamless looping
            for (let pass = 0; pass < 2; pass++) {
                const xOff = waterX + (flowOffset + pass * waterW) % waterW - waterW * 0.1;
                ctx.beginPath();
                ctx.moveTo(xOff, sy);
                for (let x = xOff; x < xOff + waterW + 20; x += 14) {
                    const wy = sy + Math.sin((x - xOff) * 0.022 + t * 1.8 + si) * 2.2
                             + Math.cos((x - xOff) * 0.04 + t * 0.9) * 1.1;
                    ctx.lineTo(x, wy);
                }
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    renderUnderwaterSinkingIdol(ctx) {
        if (!this.underwaterSinkingIdol) return;
        const idol = this.underwaterSinkingIdol;
        ctx.save();
        ctx.globalAlpha = Math.max(0, idol.opacity);

        // Murti 3D Sculpture submerged in Holy Water
        if (idol.customCanvas) {
            ctx.drawImage(idol.customCanvas, idol.x, idol.y, idol.width, idol.height);
        } else if (this.customIdolImg && this.customIdolImg.complete) {
            ctx.drawImage(this.customIdolImg, idol.x, idol.y, idol.width, idol.height);
        } else {
            const img = this.loadedImages[idol.archetype.id];
            if (img && img.complete) {
                ctx.drawImage(img, idol.x, idol.y, idol.width, idol.height);
            }
        }

        // Divine golden dissolving aura & sparks in deep water
        ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(idol.x + idol.width / 2, idol.y + idol.height / 2, idol.width * 0.5, idol.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderBonusLaddus(ctx) {
        this.laddus.forEach(laddu => {
            if (!laddu.collected) {
                laddu.sparkle += 0.05;
                const bobY = Math.sin(laddu.sparkle) * 4;

                // Golden Glow aura
                ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
                ctx.beginPath();
                ctx.arc(laddu.x, laddu.y + bobY, 18, 0, Math.PI * 2);
                ctx.fill();

                // Yellow Laddu shape
                const ladduGrad = ctx.createRadialGradient(laddu.x - 3, laddu.y + bobY - 3, 2, laddu.x, laddu.y + bobY, 12);
                ladduGrad.addColorStop(0, '#fff9c4');
                ladduGrad.addColorStop(0.4, '#ffd700');
                ladduGrad.addColorStop(1, '#ff8f00');

                ctx.fillStyle = ladduGrad;
                ctx.beginPath();
                ctx.arc(laddu.x, laddu.y + bobY, 11, 0, Math.PI * 2);
                ctx.fill();

                // Modak top pinch
                ctx.fillStyle = '#ff6f00';
                ctx.beginPath();
                ctx.moveTo(laddu.x - 4, laddu.y + bobY - 9);
                ctx.lineTo(laddu.x, laddu.y + bobY - 16);
                ctx.lineTo(laddu.x + 4, laddu.y + bobY - 9);
                ctx.closePath();
                ctx.fill();

                // "+50" Tag badge
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('+50', laddu.x, laddu.y + bobY + 22);
            }
        });
    }

    renderIdolQueue(ctx) {
        this.idolQueue.forEach(idol => {
            if (!idol.isPicked || this.attachedIdol === idol) {
                ctx.save();
                ctx.translate(idol.x, idol.y);

                // Realistic 3D Ground Contact Shadow on the stone promenade
                if (!idol.isPicked) {
                    const shadowGrad = ctx.createRadialGradient(
                        idol.width / 2, idol.height - 3, 8,
                        idol.width / 2, idol.height - 3, idol.width * 0.48
                    );
                    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
                    shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
                    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = shadowGrad;
                    ctx.beginPath();
                    ctx.ellipse(idol.width / 2, idol.height - 3, idol.width * 0.48, 9, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Divine Golden Aura behind the active pickup idol or lifted idol
                if (idol === this.idolQueue[0] || this.attachedIdol === idol) {
                    const glowGrad = ctx.createRadialGradient(
                        idol.width / 2, idol.height * 0.45, 10,
                        idol.width / 2, idol.height * 0.45, idol.width * 0.58
                    );
                    glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
                    glowGrad.addColorStop(0.6, 'rgba(255, 160, 0, 0.18)');
                    glowGrad.addColorStop(1, 'rgba(255, 111, 0, 0)');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(idol.width / 2, idol.height * 0.45, idol.width * 0.58, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Render Authentic 3D Sculpted Vigraham (Transparent Murti Silhouette)
                if (idol.customCanvas) {
                    ctx.drawImage(idol.customCanvas, 0, 0, idol.width, idol.height);
                } else if (this.customIdolImg && this.customIdolImg.complete) {
                    ctx.drawImage(this.customIdolImg, 0, 0, idol.width, idol.height);
                } else {
                    const img = this.loadedImages[idol.archetype.id];
                    if (img && img.complete) {
                        ctx.drawImage(img, 0, 0, idol.width, idol.height);
                    } else {
                        ctx.fillStyle = '#ffd700';
                        ctx.beginPath();
                        ctx.arc(idol.width / 2, idol.height / 2, 28, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Heavy-Duty Slings Anchor Shackles on the Statue Pedestal when Hooked
                if (this.attachedIdol === idol) {
                    const baseAttachY = idol.height - 12;
                    ctx.fillStyle = '#ffab00';
                    ctx.beginPath();
                    ctx.arc(10, baseAttachY, 4.5, 0, Math.PI * 2);
                    ctx.arc(idol.width - 10, baseAttachY, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#212121';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.restore();
            }
        });
    }

    renderCraneMechanism(ctx, w, h) {
        const mastX = w * 0.035;
        const boomY = h * 0.14;
        const boomEnd = w * 0.94;

        // 1. Vertical Steel Lattice Mast (Tower) with 3D Bevel & Metallic Shading
        const mastGrad = ctx.createLinearGradient(mastX - 7, 0, mastX + 7, 0);
        mastGrad.addColorStop(0, '#f9a825');
        mastGrad.addColorStop(0.4, '#fdd835');
        mastGrad.addColorStop(0.8, '#f57f17');
        mastGrad.addColorStop(1, '#e65100');
        ctx.fillStyle = mastGrad;
        ctx.fillRect(mastX - 6, boomY, 12, h - boomY - 30);
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(mastX - 6, boomY, 12, h - boomY - 30);

        // Lattice diagonal steel cross-bracing
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let y = boomY; y < h - 40; y += 22) {
            ctx.moveTo(mastX - 6, y);
            ctx.lineTo(mastX + 6, y + 22);
            ctx.moveTo(mastX + 6, y);
            ctx.lineTo(mastX - 6, y + 22);
        }
        ctx.stroke();

        // 2. Crane Operator Cabin with realistic glass & shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(mastX - 18, boomY - 8, 36, 28); // shadow
        ctx.fillStyle = '#263238';
        ctx.fillRect(mastX - 16, boomY - 10, 32, 26);
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(mastX - 16, boomY - 10, 32, 26);

        // Cabin blue tint window
        const windowGrad = ctx.createLinearGradient(mastX - 12, boomY - 6, mastX + 12, boomY + 7);
        windowGrad.addColorStop(0, '#e0f7fa');
        windowGrad.addColorStop(0.5, '#4fc3f7');
        windowGrad.addColorStop(1, '#0288d1');
        ctx.fillStyle = windowGrad;
        ctx.fillRect(mastX - 12, boomY - 6, 24, 13);

        // 3. Top Horizontal Jib / Boom with Metallic Gradient
        const boomGrad = ctx.createLinearGradient(0, boomY - 7, 0, boomY + 7);
        boomGrad.addColorStop(0, '#fff59d');
        boomGrad.addColorStop(0.3, '#fbc02d');
        boomGrad.addColorStop(0.7, '#f57f17');
        boomGrad.addColorStop(1, '#e65100');
        ctx.fillStyle = boomGrad;
        ctx.fillRect(0, boomY - 6, boomEnd, 12);
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, boomY - 6, boomEnd, 12);

        // High-tensile Boom support tie cables
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mastX, boomY - 45);
        ctx.lineTo(0, boomY);
        ctx.moveTo(mastX, boomY - 45);
        ctx.lineTo(boomEnd * 0.4, boomY);
        ctx.moveTo(mastX, boomY - 45);
        ctx.lineTo(boomEnd * 0.8, boomY);
        ctx.stroke();

        // 4. Moving Trolley Carriage
        const tx = this.crane.trolleyX;
        ctx.fillStyle = '#1e272c';
        ctx.fillRect(tx - 18, boomY - 8, 36, 16);
        ctx.fillStyle = '#ffd600';
        ctx.fillRect(tx - 14, boomY - 2, 28, 4);

        // Trolley wheels
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(tx - 12, boomY - 7, 3, 0, Math.PI * 2);
        ctx.arc(tx + 12, boomY - 7, 3, 0, Math.PI * 2);
        ctx.fill();

        // 5. Vertical Hoist Steel Braided Cables
        const swayOffsetX = Math.sin(this.crane.swayAngle) * 25;
        const hookX = tx + swayOffsetX;
        const hookY = this.crane.hoistY;

        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx - 6, boomY + 8);
        ctx.lineTo(hookX - 6, hookY);
        ctx.moveTo(tx + 6, boomY + 8);
        ctx.lineTo(hookX + 6, hookY);
        ctx.stroke();

        // 6. Dual Yellow-and-Black Hazard Lifting Slings
        this.renderHazardClamps(ctx, hookX, hookY);
    }

    renderHazardClamps(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.crane.swayAngle);

        // Winch Pulley Block
        ctx.fillStyle = '#263238';
        ctx.fillRect(-12, -10, 24, 14);
        ctx.strokeStyle = '#ffab00';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-12, -10, 24, 14);

        // Pulley wheel
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(0, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Rigging Spreader Bar (Dynamically sized via crane.clampWidth)
        const barW = this.crane.clampWidth;
        const barGrad = ctx.createLinearGradient(-barW / 2, 4, barW / 2, 10);
        barGrad.addColorStop(0, '#263238');
        barGrad.addColorStop(0.5, '#455a64');
        barGrad.addColorStop(1, '#263238');
        ctx.fillStyle = barGrad;
        ctx.fillRect(-barW / 2, 4, barW, 6);

        // Left Hazard Slings Arm [
        this.drawHazardStripedArm(ctx, -barW / 2 + 2, 10, true);

        // Right Hazard Slings Arm ]
        this.drawHazardStripedArm(ctx, barW / 2 - 14, 10, false);

        // Real-time Size Indicator & Holographic Alignment Guides when unattached near road
        if (!this.attachedIdol && this.idolQueue.length > 0) {
            const targetIdol = this.idolQueue[0];
            const targetGrip = targetIdol.gripWidth || targetIdol.width;
            const sizeDiff = Math.abs(barW - targetGrip);
            const isMatched = sizeDiff <= 14;

            // Small width readout badge above crane spreader bar
            ctx.save();
            ctx.font = 'bold 11px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            const badgeText = `🔧 ${Math.round(barW)}px ${isMatched ? '✓ Match' : (barW < targetGrip ? '▲ + Expand' : '▼ − Shrink')}`;
            const textWidth = ctx.measureText(badgeText).width;
            const bW = textWidth + 14;

            ctx.fillStyle = isMatched ? 'rgba(46, 125, 50, 0.92)' : 'rgba(33, 33, 33, 0.88)';
            ctx.strokeStyle = isMatched ? '#81c784' : (barW < targetGrip ? '#ffd54f' : '#ffb74d');
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-bW / 2, -26, bW, 17, 5);
            } else {
                ctx.rect(-bW / 2, -26, bW, 17);
            }
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isMatched ? '#ffffff' : '#fff9c4';
            ctx.fillText(badgeText, 0, -13);

            // Laser guide lines when positioned over/near the pickup area
            const idolCenterX = targetIdol.x + targetIdol.width / 2;
            const distToIdol = Math.abs(this.crane.trolleyX - idolCenterX);
            if (distToIdol < 90) {
                ctx.strokeStyle = isMatched ? 'rgba(76, 175, 80, 0.8)' : (barW < targetGrip ? 'rgba(255, 179, 0, 0.65)' : 'rgba(255, 112, 67, 0.65)');
                ctx.lineWidth = isMatched ? 2 : 1.5;
                ctx.setLineDash([4, 4]);

                const guideTop = 48;
                const guideBottom = Math.max(guideTop + 15, targetIdol.y - (y + 10));

                ctx.beginPath();
                ctx.moveTo(-barW / 2 + 8, guideTop);
                ctx.lineTo(-barW / 2 + 8, guideBottom);
                ctx.moveTo(barW / 2 - 8, guideTop);
                ctx.lineTo(barW / 2 - 8, guideBottom);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.restore();
        }

        // ONLY DRAW CONNECTING SLINGS IF AN IDOL IS CURRENTLY ATTACHED! (EMPTY WHEN RISING!)
        if (this.attachedIdol) {
            const slingAttachY = 35 + this.attachedIdol.height - 12;
            const idolHalfW = this.attachedIdol.width / 2;

            ctx.strokeStyle = '#ffd600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Left heavy sling down to idol base
            ctx.moveTo(-barW / 2 + 6, 45);
            ctx.lineTo(-idolHalfW + 10, slingAttachY);
            // Right heavy sling down to idol base
            ctx.moveTo(barW / 2 - 6, 45);
            ctx.lineTo(idolHalfW - 10, slingAttachY);
            ctx.stroke();

            // Hazard stripe highlights on slings
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(-barW / 2 + 6, 45);
            ctx.lineTo(-idolHalfW + 10, slingAttachY);
            ctx.moveTo(barW / 2 - 6, 45);
            ctx.lineTo(idolHalfW - 10, slingAttachY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    drawHazardStripedArm(ctx, x, y, isLeft) {
        const w = 12;
        const h = 38;

        // Base yellow strap
        ctx.fillStyle = '#ffd600';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        // Black diagonal hazard stripes (///)
        ctx.fillStyle = '#212121';
        for (let stripeY = y + 4; stripeY < y + h - 6; stripeY += 10) {
            ctx.beginPath();
            ctx.moveTo(x, stripeY);
            ctx.lineTo(x + w, stripeY + 6);
            ctx.lineTo(x + w, stripeY + 10);
            ctx.lineTo(x, stripeY + 4);
            ctx.closePath();
            ctx.fill();
        }

        // Bottom Hook / Shackle
        ctx.fillStyle = '#ffab00';
        ctx.beginPath();
        if (isLeft) {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w + 6, y + h);
            ctx.lineTo(x + w + 6, y + h - 5);
            ctx.lineTo(x + w, y + h - 5);
            ctx.lineTo(x, y + h);
        } else {
            ctx.moveTo(x + w, y + h);
            ctx.lineTo(x - 6, y + h);
            ctx.lineTo(x - 6, y + h - 5);
            ctx.lineTo(x - 6, y + h - 5);
            ctx.lineTo(x + w, y + h);
        }
        ctx.fill();
        ctx.stroke();
    }

    renderFlyingBirds(ctx, w, h) {
        const t = this.time;

        this.birds.forEach((bird, idx) => {
            ctx.save();
            ctx.translate(bird.x, bird.y);

            // True 2D flight heading (+1 faces right, -1 faces left)
            const heading = bird.heading || (bird.vx >= 0 ? 1 : -1);
            ctx.scale(heading, 1);

            // Natural flight banking angle according to vertical climb/dive
            const bankAngle = Math.max(-0.25, Math.min(0.25, (bird.vy / Math.abs(bird.vx || 1)) * 0.35));
            ctx.rotate(bankAngle);

            const s = bird.size * bird.depth;
            const ws = bird.wingSpan * bird.depth;

            // Wing animation cycle:
            // Gliding: slight breathing flex with wings held out
            // Flapping: natural downstroke power and upstroke flex
            let wingAngle;
            let bodyBob = 0;
            if (bird.isGliding) {
                wingAngle = 0.12 + Math.sin(t * 1.5 + idx) * 0.05; // slight upward dihedral
                bodyBob = Math.sin(t * 1.5 + idx) * 0.4;
            } else {
                const rawFlap = Math.sin(bird.wingPhase);
                wingAngle = rawFlap * 0.92; // -0.92 to +0.92 radians
                bodyBob = -rawFlap * 1.1;   // Body bobs opposite to wing motion
            }

            // Natural sunset silhouette color matching the sky
            let silColor, farWingColor;
            if (this.currentEnv === 'night') {
                silColor     = 'rgba(16, 26, 46, 0.88)';
                farWingColor = 'rgba(10, 18, 34, 0.72)';
            } else if (this.currentEnv === 'greenery') {
                silColor     = 'rgba(22, 28, 18, 0.90)';
                farWingColor = 'rgba(14, 20, 12, 0.74)';
            } else {
                // River at sunset / ghat: warm rich charcoal-umber silhouette
                silColor     = 'rgba(32, 20, 10, 0.92)';
                farWingColor = 'rgba(20, 12, 6, 0.74)';
            }

            // =================================================================
            // 1. FAR WING (Drawn BEHIND the body)
            // =================================================================
            ctx.save();
            ctx.translate(-s * 0.05, bodyBob - s * 0.08);
            ctx.fillStyle = farWingColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Far wing extends upward/downward and sweeps back
            const fElbowX = -ws * 0.28;
            const fElbowY = -wingAngle * ws * 0.55 - ws * 0.10;
            const fTipX   = -ws * 0.65;
            const fTipY   = -wingAngle * ws * 0.85 - ws * 0.05;

            ctx.quadraticCurveTo(fElbowX, fElbowY, fTipX, fTipY);
            ctx.quadraticCurveTo(fElbowX * 0.7, fElbowY + s * 0.24, -s * 0.18, s * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // =================================================================
            // 2. BIRD BODY, HEAD, BEAK & TAIL (Horizontal aerodynamic profile)
            // =================================================================
            ctx.save();
            ctx.translate(0, bodyBob);
            ctx.fillStyle = silColor;

            // Streamlined torso
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.38, s * 0.12, -0.06, 0, Math.PI * 2);
            ctx.fill();

            // Chest curve
            ctx.beginPath();
            ctx.arc(s * 0.18, 0, s * 0.13, 0, Math.PI * 2);
            ctx.fill();

            // Head (facing forward in direction of flight)
            ctx.beginPath();
            ctx.arc(s * 0.36, -s * 0.04, s * 0.09, 0, Math.PI * 2);
            ctx.fill();

            // Beak (sharp slender triangle pointing forward)
            ctx.beginPath();
            ctx.moveTo(s * 0.42, -s * 0.06);
            ctx.lineTo(s * 0.58, -s * 0.02);
            ctx.lineTo(s * 0.42, 0.02);
            ctx.closePath();
            ctx.fill();

            // Tail feathers (slender fan shape trailing behind)
            ctx.beginPath();
            ctx.moveTo(-s * 0.28, -s * 0.02);
            ctx.lineTo(-s * 0.58, -s * 0.10);
            ctx.lineTo(-s * 0.52, 0);
            ctx.lineTo(-s * 0.58, s * 0.10);
            ctx.lineTo(-s * 0.28, s * 0.04);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // =================================================================
            // 3. NEAR WING (Drawn IN FRONT of the body)
            // =================================================================
            ctx.save();
            ctx.translate(s * 0.04, bodyBob);
            ctx.fillStyle = silColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            const nElbowX = -ws * 0.30;
            const nElbowY = -wingAngle * ws * 0.65 - ws * 0.08;
            const nTipX   = -ws * 0.75;
            const nTipY   = -wingAngle * ws * 1.05;

            // Leading wing edge
            ctx.quadraticCurveTo(nElbowX, nElbowY, nTipX, nTipY);
            // Trailing wing edge with primary flight feather curve
            ctx.quadraticCurveTo(nElbowX * 0.65, nElbowY + s * 0.32, -s * 0.22, s * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.restore();
        });
    }

    renderLivingWater(ctx, w, h) {
        const waterX = this.world.pierEdgeX;
        const waterW = w - waterX;
        const waterTopY = this.world.waterSurfaceY;
        const waterH = h - waterTopY;
        const time = this.time;

        // =====================================================================
        // ZONE 1: DISTANT & MID-RIVER HORIZON FLOW & SUNSET REFLECTION TRAIL
        // (Visible across the holy river from x ≈ w * 0.48 to w, and y ≈ h * 0.40 to waterTopY)
        // =====================================================================
        const farRiverY = h * 0.40;
        const farRiverH = waterTopY - farRiverY;
        const farRiverX = w * 0.48;
        const farRiverW = w - farRiverX;

        // --- 1A. Flowing Horizontal River Currents (Drifting downstream) ---
        ctx.save();
        const currentBands = 7;
        for (let ci = 0; ci < currentBands; ci++) {
            const frac = ci / currentBands;
            const yBase = farRiverY + 10 + frac * (farRiverH - 15);
            const speed = 1.1 + (ci % 3) * 0.35;
            const flowOffset = (time * speed * 30) % farRiverW;

            // Soft organic flowing water current glints
            let waveColor;
            if (this.currentEnv === 'night') {
                waveColor = `rgba(180, 220, 255, ${0.10 + frac * 0.10})`;
            } else if (this.currentEnv === 'greenery') {
                waveColor = `rgba(140, 240, 210, ${0.12 + frac * 0.12})`;
            } else {
                waveColor = `rgba(255, 220, 140, ${0.14 + frac * 0.14})`;
            }

            ctx.fillStyle = waveColor;
            for (let rx = 0; rx < farRiverW; rx += 45) {
                const gx = farRiverX + ((rx + flowOffset) % farRiverW);
                const gy = yBase + Math.sin(rx * 0.03 + time * 1.5 + ci) * 2.0;
                const glintW = 16 + (ci % 3) * 8;
                ctx.beginPath();
                ctx.ellipse(gx, gy, glintW, 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // --- 1B. The "River of Gold" - Molten Sun Reflection Trail ---
        // The setting sun casts an intense glittering reflection path down the water
        const sunCenterX = w * 0.77;
        const sunPathHalfW = w * 0.11;

        ctx.save();
        const glintRows = 16;
        for (let row = 0; row < glintRows; row++) {
            const rowFrac = row / glintRows;
            const gy = farRiverY + 6 + rowFrac * (h - farRiverY - 20);
            const rowW = sunPathHalfW * (0.6 + rowFrac * 0.9);
            const numGlints = 4 + Math.floor(rowFrac * 6);

            for (let g = 0; g < numGlints; g++) {
                const gFrac = (g + 0.5) / numGlints;
                const gx = sunCenterX - rowW + (gFrac * rowW * 2) + Math.sin(time * 2.5 + row * 1.3 + g) * 8;
                
                // Pulsing shimmer phase
                const gPhase = Math.sin(time * 3.8 + row * 0.9 + g * 1.4);
                if (gPhase < 0.1) continue;

                const gAlpha = (gPhase * 0.5 + 0.5) * (0.35 + (1 - Math.abs(gFrac - 0.5) * 2) * 0.45);
                const glintLen = 6 + rowFrac * 14 + Math.sin(time * 3.0 + g) * 4;

                let glintColor;
                if (this.currentEnv === 'night') {
                    glintColor = `rgba(220, 245, 255, ${gAlpha * 0.85})`;
                } else if (this.currentEnv === 'greenery') {
                    glintColor = `rgba(210, 255, 240, ${gAlpha * 0.85})`;
                } else {
                    // Brilliant sunset molten gold
                    glintColor = `rgba(255, 248, 180, ${gAlpha})`;
                }

                ctx.fillStyle = glintColor;
                ctx.beginPath();
                ctx.ellipse(gx, gy, glintLen, 1.2 + rowFrac * 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // =====================================================================
        // ZONE 2: FOREGROUND IMMERSION BASIN (Under the Crane)
        // Multi-layered rolling wave swells, translucency & depth
        // =====================================================================

        // --- 2A. Meniscus Water Surface Wave (Boundary where water meets the air) ---
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(waterX, waterTopY);
        for (let x = waterX; x <= w + 4; x += 4) {
            const relX = x - waterX;
            const wy = waterTopY
                + Math.sin(relX * 0.020 + time * 1.8) * 3.8
                + Math.sin(relX * 0.038 - time * 1.1) * 2.2
                + Math.cos(relX * 0.012 + time * 0.7) * 1.6;
            ctx.lineTo(x, wy);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(waterX, h);
        ctx.closePath();

        // Rich translucent depth gradient
        let topWaterGrad;
        if (this.currentEnv === 'night') {
            topWaterGrad = ctx.createLinearGradient(waterX, waterTopY, waterX, h);
            topWaterGrad.addColorStop(0, 'rgba(40, 90, 160, 0.35)');
            topWaterGrad.addColorStop(0.35, 'rgba(15, 45, 95, 0.42)');
            topWaterGrad.addColorStop(1, 'rgba(4, 12, 35, 0.60)');
        } else if (this.currentEnv === 'river') {
            topWaterGrad = ctx.createLinearGradient(waterX, waterTopY, waterX, h);
            topWaterGrad.addColorStop(0, 'rgba(160, 105, 35, 0.35)');
            topWaterGrad.addColorStop(0.35, 'rgba(110, 65, 18, 0.42)');
            topWaterGrad.addColorStop(1, 'rgba(45, 22, 5, 0.62)');
        } else if (this.currentEnv === 'greenery') {
            topWaterGrad = ctx.createLinearGradient(waterX, waterTopY, waterX, h);
            topWaterGrad.addColorStop(0, 'rgba(20, 130, 115, 0.35)');
            topWaterGrad.addColorStop(0.35, 'rgba(10, 85, 75, 0.42)');
            topWaterGrad.addColorStop(1, 'rgba(2, 28, 24, 0.62)');
        } else {
            topWaterGrad = ctx.createLinearGradient(waterX, waterTopY, waterX, h);
            topWaterGrad.addColorStop(0, 'rgba(25, 100, 175, 0.38)');
            topWaterGrad.addColorStop(0.35, 'rgba(12, 60, 130, 0.45)');
            topWaterGrad.addColorStop(1, 'rgba(3, 16, 50, 0.62)');
        }
        ctx.fillStyle = topWaterGrad;
        ctx.fill();
        ctx.restore();

        // --- 2B. Soft Liquid Wave Highlights ---
        ctx.save();
        const swellCount = 4;
        for (let si = 0; si < swellCount; si++) {
            const sFrac = si / swellCount;
            const baseY = waterTopY + 12 + sFrac * (waterH * 0.80);
            const speed = 1.0 + si * 0.22;

            let crestColor;
            if (this.currentEnv === 'night') {
                crestColor = `rgba(200, 235, 255, ${0.16 - si * 0.03})`;
            } else {
                crestColor = `rgba(255, 235, 165, ${0.20 - si * 0.04})`;
            }

            ctx.fillStyle = crestColor;
            for (let wx = 0; wx < waterW; wx += 48) {
                const gx = waterX + wx + Math.sin(time * speed + si) * 14;
                const gy = baseY + Math.sin(wx * 0.025 + time * speed * 1.2 + si) * 3.2;
                ctx.beginPath();
                ctx.ellipse(gx, gy, 22 + (si % 2) * 10, 2.0, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // =====================================================================
        // ZONE 3: SACRED FLOATING DIYAS (Traditional Deepams with Flickering Flame)
        // =====================================================================
        if (this.floatingDiyas && this.floatingDiyas.length > 0) {
            this.floatingDiyas.forEach((diya, didx) => {
                ctx.save();
                ctx.translate(diya.x, diya.y);

                const ds = diya.size || 11;
                const flameFlicker = Math.sin(diya.flamePhase || (time * 6 + didx)) * 0.25;

                // 1. Warm Golden Halo Glow
                const haloGrad = ctx.createRadialGradient(0, -ds * 0.3, 2, 0, -ds * 0.3, ds * 2.2);
                haloGrad.addColorStop(0, 'rgba(255, 215, 0, 0.65)');
                haloGrad.addColorStop(0.4, 'rgba(255, 140, 0, 0.35)');
                haloGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
                ctx.fillStyle = haloGrad;
                ctx.beginPath();
                ctx.arc(0, -ds * 0.3, ds * 2.2, 0, Math.PI * 2);
                ctx.fill();

                // 2. Downward Water Reflection Shimmer
                ctx.fillStyle = 'rgba(255, 200, 60, 0.28)';
                ctx.beginPath();
                ctx.ellipse(0, ds * 0.8, ds * 0.6, ds * 0.9 + Math.sin(time * 3 + didx) * 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // 3. Earthen Clay Diya Bowl (Terracotta)
                ctx.fillStyle = '#6d2e08';
                ctx.beginPath();
                ctx.moveTo(-ds, 0);
                ctx.quadraticCurveTo(0, ds * 0.75, ds, 0);
                ctx.quadraticCurveTo(0, ds * 0.25, -ds, 0);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#3d1a04';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Diya golden rim
                ctx.strokeStyle = 'rgba(255, 190, 80, 0.65)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.ellipse(0, 0, ds * 0.9, ds * 0.22, 0, 0, Math.PI * 2);
                ctx.stroke();

                // 4. Sacred Flickering Flame
                const flameH = ds * (1.2 + flameFlicker);
                const flameW = ds * 0.45;

                // Outer orange flame
                ctx.fillStyle = '#ff6f00';
                ctx.beginPath();
                ctx.moveTo(-flameW, 0);
                ctx.quadraticCurveTo(-flameW * 0.6, -flameH * 0.6, 0, -flameH);
                ctx.quadraticCurveTo(flameW * 0.6, -flameH * 0.6, flameW, 0);
                ctx.closePath();
                ctx.fill();

                // Inner yellow flame
                ctx.fillStyle = '#ffd600';
                ctx.beginPath();
                ctx.moveTo(-flameW * 0.6, 0);
                ctx.quadraticCurveTo(-flameW * 0.3, -flameH * 0.5, 0, -flameH * 0.85);
                ctx.quadraticCurveTo(flameW * 0.3, -flameH * 0.5, flameW * 0.6, 0);
                ctx.closePath();
                ctx.fill();

                // Pure white flame core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(-flameW * 0.25, 0);
                ctx.quadraticCurveTo(0, -flameH * 0.4, 0, -flameH * 0.55);
                ctx.quadraticCurveTo(0, -flameH * 0.4, flameW * 0.25, 0);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            });
        }

        // =====================================================================
        // ZONE 4: SPECULAR SUN/MOONLIGHT SPARKLES
        // =====================================================================
        ctx.save();
        this.waterSparkles.forEach((sp, idx) => {
            const alpha = (Math.sin(sp.phase) * 0.5 + 0.5);
            if (alpha < 0.08) return;

            let sColor;
            if (this.currentEnv === 'night')      sColor = `rgba(195, 235, 255, ${alpha * 0.90})`;
            else if (this.currentEnv === 'river') sColor = `rgba(255, 230, 150, ${alpha * 0.95})`;
            else                                  sColor = `rgba(255, 248, 190, ${alpha * 0.92})`;

            ctx.shadowColor = this.currentEnv === 'night' ? '#80d8ff' : '#fff176';
            ctx.shadowBlur = 4 + alpha * 4;
            ctx.fillStyle = sColor;

            // 4-pointed diamond glint
            const r = sp.size * (0.65 + alpha * 0.8);
            ctx.save();
            ctx.translate(sp.x, sp.y);
            ctx.rotate(time * 0.6 + idx);
            ctx.beginPath();
            for (let pt = 0; pt < 4; pt++) {
                const angle = (pt / 4) * Math.PI * 2;
                const outerX = Math.cos(angle) * r * 2.4;
                const outerY = Math.sin(angle) * r * 2.4;
                const innerX = Math.cos(angle + Math.PI / 4) * r * 0.45;
                const innerY = Math.sin(angle + Math.PI / 4) * r * 0.45;
                if (pt === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.shadowBlur = 0;
        ctx.restore();

        // =====================================================================
        // ZONE 5: FLOATING SACRED FLOWER PETALS (Marigolds & Rose)
        // =====================================================================
        ctx.save();
        this.flutteringPetals.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.globalAlpha = p.alpha || 0.85;

            // Petal teardrop
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.8, p.size * 0.5, 0, p.size * 0.6);
            ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.8, -p.size * 0.5, 0, -p.size);
            ctx.fill();

            // Delicate petal vein
            ctx.strokeStyle = 'rgba(255,255,255,0.28)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -p.size * 0.85);
            ctx.lineTo(0, p.size * 0.35);
            ctx.stroke();

            ctx.restore();
        });
        ctx.restore();

        // =====================================================================
        // ZONE 6: SOFT RIVER MIST / VAPOR
        // =====================================================================
        ctx.save();
        this.waterMist.forEach(m => {
            const mistAlpha = m.alpha * (0.6 + Math.sin(m.phase) * 0.4);
            const mGrad = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, m.radius);
            mGrad.addColorStop(0, `rgba(255, 245, 230, ${mistAlpha * 0.85})`);
            mGrad.addColorStop(0.5, `rgba(240, 220, 200, ${mistAlpha * 0.35})`);
            mGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = mGrad;
            ctx.beginPath();
            ctx.ellipse(m.x, m.y, m.radius * 1.6, m.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    renderEffectsAndParticles(ctx) {
        // Water ripples
        this.ripples.forEach(r => {
            ctx.strokeStyle = `rgba(128, 222, 234, ${r.alpha})`;
            ctx.lineWidth = r.lineWidth;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.radius * 1.6, r.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Underwater Bubbles
        this.bubbles.forEach(b => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Water splash droplets
        this.splashes.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Aura sparks
        this.auraSparks.forEach(s => {
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.nimarjanamGame = new NimarjanamGame();
    window.nimarjanamGame.init();
});
