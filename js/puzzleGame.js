/**
 * Game 1: Authentic Interlocking Jigsaw Puzzle Assembly Engine
 * Generates true classic interlocking jigsaw puzzle pieces with rounded tabs (knobs) & blanks (sockets),
 * realistic 3D bevels, 500 levels, reference preview, hint overlay, drag-and-snap, and visarjan transition.
 */

class PuzzleGame {
    constructor() {
        this.currentLevel = 1;
        this.gridSize = 3; // Default 3x3 (supports full range 2x2 to 12x12)
        this.boardContainer = null;
        this.trayContainer = null;
        this.refCanvas = null;
        this.offscreenMurtiCanvas = null;
        this.idolData = null;

        this.pieces = []; // Array of piece objects
        this.slots = [];  // Array of slot objects
        this.moves = 0;
        this.startTime = 0;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.isCompleted = false;

        // Progressive & Custom Grid Sizing State
        this.userCustomGridSize = null; // User manual override (null = auto-scaled by level)
        this.gridSize = 3;              // Active grid dimension (2 to 12)

        // Dragging & Active Piece Selection state
        this.heldPiece = null;          // The piece currently selected / attached to cursor
        this.isPointerDown = false;     // Pointer actively pressed
        this.pointerStartPos = { x: 0, y: 0 };
        this.hasDraggedDistance = false;
        this.dragOffset = { x: 0, y: 0 };
        this.hintOverlay = null;
        this.isGhostHintActive = false;
    }

    init() {
        this.boardContainer = document.getElementById('puzzle-board');
        this.trayContainer = document.getElementById('puzzle-tray');
        this.refCanvas = document.getElementById('puzzle-ref-canvas');

        // Setup offscreen canvas for rendering source high-res idol image
        this.offscreenMurtiCanvas = document.createElement('canvas');
        this.offscreenMurtiCanvas.width = 600;
        this.offscreenMurtiCanvas.height = 600;

        this.currentLevel = window.progressTracker.getPuzzleCurrentLevel();
        this.bindEvents();
    }

    bindEvents() {
        // Global pointer move and up for smooth dragging & following across desktop & touch devices
        window.addEventListener('pointermove', (e) => this.handlePointerMove(e), { passive: false });
        window.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        window.addEventListener('pointercancel', (e) => this.handlePointerUp(e));

        // Escape key drops held piece back into tray
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.heldPiece) {
                this.returnHeldPieceToTray();
            }
        });

        // Grid size controls (allow user to manually change difficulty anytime if level is too easy or too hard)
        const gridBtns = document.querySelectorAll('.grid-size-btn');
        gridBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const chosenSize = parseInt(btn.dataset.size) || 3;
                this.userCustomGridSize = chosenSize;
                this.gridSize = chosenSize;
                this.updateGridSizeUI();
                this.startLevel(this.currentLevel, true);
            });
        });

        // Hint button
        const hintBtn = document.getElementById('puzzle-hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.toggleHint());
        }

        // Restart button
        const restartBtn = document.getElementById('puzzle-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.startLevel(this.currentLevel, true));
        }
    }

    /**
     * Determines natural progressive difficulty grid dimension based on level tier (2x2 to 12x12).
     * Level 1-5: 2x2 (4 pieces - Quick easy onboarding)
     * Level 6-25: 3x3 (9 pieces - Classic festive)
     * Level 26-60: 4x4 (16 pieces - Intermediate challenge)
     * Level 61-110: 5x5 (25 pieces - Devotee level)
     * Level 111-170: 6x6 (36 pieces - Skilled builder)
     * Level 171-240: 7x7 (49 pieces - Advanced artisan)
     * Level 241-310: 8x8 (64 pieces - Temple architect)
     * Level 311-380: 9x9 (81 pieces - Sacred master)
     * Level 381-430: 10x10 (100 pieces - Grand devotee)
     * Level 431-470: 11x11 (121 pieces - Supreme yogi)
     * Level 471-500: 12x12 (144 pieces - Divine Anant Chaturdashi Master!)
     */
    getDefaultGridSizeForLevel(level) {
        if (level <= 5) return 2;
        if (level <= 25) return 3;
        if (level <= 60) return 4;
        if (level <= 110) return 5;
        if (level <= 170) return 6;
        if (level <= 240) return 7;
        if (level <= 310) return 8;
        if (level <= 380) return 9;
        if (level <= 430) return 10;
        if (level <= 470) return 11;
        return 12;
    }

    loadLevel(levelNumber) {
        this.currentLevel = Math.max(1, Math.min(500, parseInt(levelNumber) || 1));
        window.progressTracker.setPuzzleCurrentLevel(this.currentLevel);
        // Reset manual override so each newly selected level defaults to its progressive tier
        this.userCustomGridSize = null;
        try {
            this.startLevel(this.currentLevel);
        } catch (err) {
            console.error("Error loading puzzle level:", err);
        }
    }

    async startLevel(levelNumber, preserveCustomSize = false) {
        // Guarantee containers are non-null
        if (!this.boardContainer) this.boardContainer = document.getElementById('puzzle-board');
        if (!this.trayContainer) this.trayContainer = document.getElementById('puzzle-tray');
        if (!this.refCanvas) this.refCanvas = document.getElementById('puzzle-ref-canvas');
        if (!this.offscreenMurtiCanvas) {
            this.offscreenMurtiCanvas = document.createElement('canvas');
            this.offscreenMurtiCanvas.width = 600;
            this.offscreenMurtiCanvas.height = 600;
        }

        this.returnHeldPieceToTray();
        const dragLayer = document.getElementById('puzzle-drag-layer');
        if (dragLayer) dragLayer.innerHTML = '';

        if (this.boardContainer) {
            this.boardContainer.classList.remove('puzzle-board-completed');
            const oldReveal = this.boardContainer.querySelector('.puzzle-board-complete-reveal');
            if (oldReveal) oldReveal.remove();
        }

        this.currentLevel = levelNumber;
        this.idolData = window.ganeshaCatalog.getIdol(this.currentLevel);
        this.isCompleted = false;
        this.moves = 0;
        this.elapsedSeconds = 0;
        this.isGhostHintActive = false;

        // Auto-scale grid size by level unless user specifically chose a custom size
        if (!preserveCustomSize && this.userCustomGridSize === null) {
            this.gridSize = this.getDefaultGridSizeForLevel(this.currentLevel);
        } else if (this.userCustomGridSize !== null) {
            this.gridSize = this.userCustomGridSize;
        }

        this.updateGridSizeUI();

        const hintBtn = document.getElementById('puzzle-hint-btn');
        if (hintBtn) {
            hintBtn.classList.remove('active');
            hintBtn.innerHTML = '<span class="btn-emoji">💡</span> Hint';
        }

        this.updateHeaderUI();
        await this.renderSourceMurti();
        this.generateJigsawPuzzle();
        this.startTimer();
    }

    updateGridSizeUI() {
        const gridBtns = document.querySelectorAll('.grid-size-btn');
        gridBtns.forEach(btn => {
            const size = parseInt(btn.dataset.size);
            if (size === this.gridSize) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateHeaderUI() {
        const levelBadge = document.getElementById('puzzle-level-title');
        const levelSub = document.getElementById('puzzle-level-subtitle');
        const movesEl = document.getElementById('puzzle-moves-count');
        const timerEl = document.getElementById('puzzle-timer-display');
        const quoteEl = document.getElementById('puzzle-darshan-quote');

        const difficultyLabels = { 
            2: 'Easy • 4 Pieces', 
            3: 'Medium • 9 Pieces', 
            4: 'Hard • 16 Pieces', 
            5: 'Expert • 25 Pieces', 
            6: 'Master • 36 Pieces',
            7: 'Artisan • 49 Pieces',
            8: 'Architect • 64 Pieces',
            9: 'Scholar • 81 Pieces',
            10: 'Champion • 100 Pieces',
            11: 'Grand Master • 121 Pieces',
            12: 'Supreme 144 Pieces!'
        };
        const diffLabel = difficultyLabels[this.gridSize] || `${this.gridSize}x${this.gridSize} (${this.gridSize * this.gridSize} Pieces)`;

        if (levelBadge) levelBadge.textContent = `LEVEL ${this.currentLevel}/500: ${this.idolData.title.toUpperCase()}`;
        if (levelSub) levelSub.textContent = `Grid: ${this.gridSize}x${this.gridSize} (${diffLabel}) • Idol: ${this.idolData.archetypeName} • Category: ${this.idolData.category}`;
        if (movesEl) movesEl.textContent = `${this.moves} Moves`;
        if (timerEl) timerEl.textContent = '00:00';
        if (quoteEl) quoteEl.textContent = `"${this.idolData.teluguQuote || this.idolData.blessing}"`;
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.startTime = Date.now();
        const timerEl = document.getElementById('puzzle-timer-display');

        this.timerInterval = setInterval(() => {
            if (this.isCompleted) return;
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
            const secs = String(this.elapsedSeconds % 60).padStart(2, '0');
            if (timerEl) timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async renderSourceMurti() {
        try {
            await Promise.race([
                window.murtiRenderer.renderToCanvas(this.offscreenMurtiCanvas, this.idolData, {
                    isPlain: false,
                    showBackdrop: true
                }),
                new Promise(r => setTimeout(r, 450))
            ]);
        } catch (err) {
            console.warn("Murti render notice:", err);
        }

        // Render to side reference thumbnail
        if (this.refCanvas) {
            this.refCanvas.width = 240;
            this.refCanvas.height = 240;
            const refCtx = this.refCanvas.getContext('2d');
            try {
                refCtx.drawImage(this.offscreenMurtiCanvas, 0, 0, 240, 240);
            } catch (e) {
                console.warn("Ref canvas draw notice:", e);
            }
        }
    }

    // =========================================================================
    // AUTHENTIC INTERLOCKING JIGSAW PATH GENERATOR
    // =========================================================================
    /**
     * Draws a single side of an interlocking jigsaw piece with smooth organic curves.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x0 - Start X
     * @param {number} y0 - Start Y
     * @param {number} x1 - End X
     * @param {number} y1 - End Y
     * @param {number} tab - Tab direction: 0 = straight boundary, 1 = tab (knob), -1 = blank (socket)
     */
    drawJigsawSide(ctx, x0, y0, x1, y1, tab) {
        if (tab === 0) {
            ctx.lineTo(x1, y1);
            return;
        }

        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);

        // Unit vector along the side
        const ux = dx / len;
        const uy = dy / len;

        // Normal vector pointing OUTSIDE the clockwise polygon for tab = +1 (Knob), INSIDE for tab = -1 (Socket)
        const nx = uy * tab;
        const ny = -ux * tab;

        // Helper to convert parametric relative coordinates (alongSide, outNormal) to actual Canvas points
        const pt = (u, n) => ({
            x: x0 + u * dx + n * len * nx,
            y: y0 + u * dy + n * len * ny
        });

        // 1. Smooth straight baseline up to base of tab
        const p1 = pt(0.38, 0.0);
        ctx.lineTo(p1.x, p1.y);

        // 2. Smooth neck transition into knob
        const cp1a = pt(0.38, 0.035);
        const cp1b = pt(0.34, 0.07);
        const p2 = pt(0.34, 0.13);
        ctx.bezierCurveTo(cp1a.x, cp1a.y, cp1b.x, cp1b.y, p2.x, p2.y);

        // 3. Perfectly rounded bulbous circular head
        const cp2a = pt(0.34, 0.23);
        const cp2b = pt(0.43, 0.24);
        const p3 = pt(0.50, 0.24);
        ctx.bezierCurveTo(cp2a.x, cp2a.y, cp2b.x, cp2b.y, p3.x, p3.y);

        const cp3a = pt(0.57, 0.24);
        const cp3b = pt(0.66, 0.23);
        const p4 = pt(0.66, 0.13);
        ctx.bezierCurveTo(cp3a.x, cp3a.y, cp3b.x, cp3b.y, p4.x, p4.y);

        // 4. Smooth neck back to baseline
        const cp4a = pt(0.66, 0.07);
        const cp4b = pt(0.62, 0.035);
        const p5 = pt(0.62, 0.0);
        ctx.bezierCurveTo(cp4a.x, cp4a.y, cp4b.x, cp4b.y, p5.x, p5.y);

        // 5. Baseline to end of side
        ctx.lineTo(x1, y1);
    }

    /**
     * Builds a closed path for a full 4-sided jigsaw piece with specified tabs
     */
    buildJigsawPiecePath(ctx, x, y, width, height, tabs) {
        ctx.beginPath();
        // Start top-left
        ctx.moveTo(x, y);

        // Top edge: (x, y) -> (x + width, y)
        this.drawJigsawSide(ctx, x, y, x + width, y, tabs.top);

        // Right edge: (x + width, y) -> (x + width, y + height)
        this.drawJigsawSide(ctx, x + width, y, x + width, y + height, tabs.right);

        // Bottom edge: (x + width, y + height) -> (x, y + height)
        this.drawJigsawSide(ctx, x + width, y + height, x, y + height, tabs.bottom);

        // Left edge: (x, y + height) -> (x, y)
        this.drawJigsawSide(ctx, x, y + height, x, y, tabs.left);

        ctx.closePath();
    }

    generateJigsawPuzzle() {
        if (!this.boardContainer) this.boardContainer = document.getElementById('puzzle-board');
        if (!this.trayContainer) this.trayContainer = document.getElementById('puzzle-tray');
        if (!this.boardContainer || !this.trayContainer) return;

        this.boardContainer.innerHTML = '';
        this.trayContainer.innerHTML = '';

        const N = this.gridSize;
        const totalPieces = N * N;
        const boardSize = Math.min(this.boardContainer.clientWidth || 440, 460);
        const pieceSize = boardSize / N;
        const srcSize = this.offscreenMurtiCanvas.width;
        const srcPieceSize = srcSize / N;

        this.boardContainer.style.width = `${boardSize}px`;
        this.boardContainer.style.height = `${boardSize}px`;
        this.boardContainer.style.position = 'relative';

        // 1. Generate Deterministic Internal Edges
        // Horizontal internal edges (between row r and r+1)
        const hEdges = [];
        for (let r = 0; r < N - 1; r++) {
            hEdges[r] = [];
            for (let c = 0; c < N; c++) {
                const seedVal = Math.sin(this.currentLevel * 100 + r * 19 + c * 31);
                hEdges[r][c] = seedVal > 0 ? 1 : -1;
            }
        }

        // Vertical internal edges (between col c and col+1)
        const vEdges = [];
        for (let r = 0; r < N; r++) {
            vEdges[r] = [];
            for (let c = 0; c < N - 1; c++) {
                const seedVal = Math.cos(this.currentLevel * 100 + r * 23 + c * 43);
                vEdges[r][c] = seedVal > 0 ? 1 : -1;
            }
        }

        // 2. Render Clean Jigsaw Grid Guide on Board Canvas (Per-slot closed contours, zero diagonal artifacts)
        const bgGuideCanvas = document.createElement('canvas');
        bgGuideCanvas.width = boardSize;
        bgGuideCanvas.height = boardSize;
        bgGuideCanvas.className = 'puzzle-board-guide-canvas';
        const guideCtx = bgGuideCanvas.getContext('2d');

        // Fill board background with soft warm ivory
        guideCtx.fillStyle = '#fefaf4';
        guideCtx.fillRect(0, 0, boardSize, boardSize);

        // Draw each jigsaw slot contour cleanly
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const x = c * pieceSize;
                const y = r * pieceSize;
                const tabs = {
                    top: (r === 0) ? 0 : -hEdges[r - 1][c],
                    bottom: (r === N - 1) ? 0 : hEdges[r][c],
                    left: (c === 0) ? 0 : -vEdges[r][c - 1],
                    right: (c === N - 1) ? 0 : vEdges[r][c]
                };

                this.buildJigsawPiecePath(guideCtx, x, y, pieceSize, pieceSize, tabs);
                guideCtx.strokeStyle = 'rgba(212, 163, 115, 0.75)';
                guideCtx.lineWidth = 1.0;
                guideCtx.stroke();
            }
        }

        this.boardContainer.appendChild(bgGuideCanvas);

        // Dedicated High-Fidelity Hint Overlay Canvas (Directly above board guide, below placed pieces)
        const hintOverlay = document.createElement('canvas');
        hintOverlay.width = boardSize;
        hintOverlay.height = boardSize;
        hintOverlay.className = 'puzzle-hint-overlay';
        const hCtx = hintOverlay.getContext('2d');
        hCtx.drawImage(this.offscreenMurtiCanvas, 0, 0, boardSize, boardSize);
        this.boardContainer.appendChild(hintOverlay);
        this.hintOverlay = hintOverlay;

        this.slots = [];
        this.pieces = [];

        const pad = Math.ceil(pieceSize * 0.32); // Exact tab protrusion padding

        // 3. Create Slots with precise position, size, and exact jigsaw piece image ghost preview
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const slotIndex = r * N + c;
                const slotDiv = document.createElement('div');
                slotDiv.className = 'puzzle-slot';
                slotDiv.dataset.row = r;
                slotDiv.dataset.col = c;
                slotDiv.dataset.slotIndex = slotIndex;
                slotDiv.style.position = 'absolute';
                slotDiv.style.left = `${c * pieceSize}px`;
                slotDiv.style.top = `${r * pieceSize}px`;
                slotDiv.style.width = `${pieceSize}px`;
                slotDiv.style.height = `${pieceSize}px`;

                const tabs = {
                    top: (r === 0) ? 0 : -hEdges[r - 1][c],
                    bottom: (r === N - 1) ? 0 : hEdges[r][c],
                    left: (c === 0) ? 0 : -vEdges[r][c - 1],
                    right: (c === N - 1) ? 0 : vEdges[r][c]
                };

                // Exact Jigsaw Piece Ghost Image Canvas for slot hover
                const ghostCanvas = document.createElement('canvas');
                ghostCanvas.width = pieceSize + 2 * pad;
                ghostCanvas.height = pieceSize + 2 * pad;
                ghostCanvas.className = 'puzzle-slot-ghost';
                ghostCanvas.style.position = 'absolute';
                ghostCanvas.style.left = `${-pad}px`;
                ghostCanvas.style.top = `${-pad}px`;
                ghostCanvas.style.width = `${pieceSize + 2 * pad}px`;
                ghostCanvas.style.height = `${pieceSize + 2 * pad}px`;

                const gCtx = ghostCanvas.getContext('2d');
                this.buildJigsawPiecePath(gCtx, pad, pad, pieceSize, pieceSize, tabs);
                gCtx.save();
                gCtx.clip();
                // 1:1 Exact pixel identity mapping
                gCtx.drawImage(this.offscreenMurtiCanvas, pad - c * pieceSize, pad - r * pieceSize, boardSize, boardSize);
                gCtx.restore();

                // Subtle gold outline on ghost piece
                this.buildJigsawPiecePath(gCtx, pad, pad, pieceSize, pieceSize, tabs);
                gCtx.strokeStyle = 'rgba(212, 163, 115, 0.85)';
                gCtx.lineWidth = 1.2;
                gCtx.stroke();

                slotDiv.appendChild(ghostCanvas);

                // Slot click listener to place held piece directly
                slotDiv.addEventListener('pointerdown', (e) => this.handleSlotClick(e, slotDiv));
                slotDiv.addEventListener('click', (e) => this.handleSlotClick(e, slotDiv));

                this.boardContainer.appendChild(slotDiv);
                this.slots.push({
                    row: r,
                    col: c,
                    index: slotIndex,
                    x: c * pieceSize,
                    y: r * pieceSize,
                    width: pieceSize,
                    height: pieceSize,
                    element: slotDiv,
                    ghostCanvas: ghostCanvas,
                    occupiedPiece: null
                });
            }
        }

        // Board container level click listener fallback
        this.boardContainer.addEventListener('pointerdown', (e) => {
            if (this.heldPiece && e.target !== this.heldPiece.element) {
                const slot = this.getSlotUnderPointer(e.clientX, e.clientY);
                if (slot) {
                    const placed = this.placePieceInSlot(this.heldPiece, slot);
                    this.moves++;
                    const movesEl = document.getElementById('puzzle-moves-count');
                    if (movesEl) movesEl.textContent = `${this.moves} Moves`;
                    this.heldPiece = null;
                    this.clearAllGhostOverlays();
                    if (placed) {
                        this.checkBoardCompletion();
                    }
                }
            }
        });

        // 4. Create Interlocking Jigsaw Pieces
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const pieceId = r * N + c;
                const tabs = {
                    top: (r === 0) ? 0 : -hEdges[r - 1][c],
                    bottom: (r === N - 1) ? 0 : hEdges[r][c],
                    left: (c === 0) ? 0 : -vEdges[r][c - 1],
                    right: (c === N - 1) ? 0 : vEdges[r][c]
                };

                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceSize + 2 * pad;
                pieceCanvas.height = pieceSize + 2 * pad;
                const pCtx = pieceCanvas.getContext('2d');

                // Build clipping path around the interlocking jigsaw contours
                this.buildJigsawPiecePath(pCtx, pad, pad, pieceSize, pieceSize, tabs);

                // Clip and draw the exact continuous source murti image with 1:1 zero distortion
                pCtx.save();
                pCtx.clip();
                pCtx.drawImage(this.offscreenMurtiCanvas, pad - c * pieceSize, pad - r * pieceSize, boardSize, boardSize);

                // Subtle inner bevel light reflection
                this.buildJigsawPiecePath(pCtx, pad, pad, pieceSize, pieceSize, tabs);
                pCtx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                pCtx.lineWidth = 1.0;
                pCtx.stroke();
                pCtx.restore();

                // Ultra-fine subtle golden die-cut edge (very delicate 0.5px so no dark muddy lines cut across the idol)
                this.buildJigsawPiecePath(pCtx, pad, pad, pieceSize, pieceSize, tabs);
                pCtx.strokeStyle = 'rgba(212, 163, 115, 0.35)'; // Soft golden cut line
                pCtx.lineWidth = 0.5;
                pCtx.stroke();

                // Piece DOM Container
                const pieceElem = document.createElement('div');
                pieceElem.className = 'puzzle-piece';
                pieceElem.dataset.pieceId = pieceId;
                pieceElem.dataset.correctRow = r;
                pieceElem.dataset.correctCol = c;
                // Leave width/height empty while in tray so CSS preview card can style it cleanly
                pieceElem.appendChild(pieceCanvas);

                // Touch / Pointer Drag & Click Selection handler
                pieceElem.addEventListener('pointerdown', (e) => this.handlePiecePointerDown(e, pieceElem));

                this.pieces.push({
                    id: pieceId,
                    correctRow: r,
                    correctCol: c,
                    tabs: tabs,
                    pad: pad,
                    width: pieceSize + 2 * pad,
                    height: pieceSize + 2 * pad,
                    currentSlot: null,
                    element: pieceElem,
                    canvas: pieceCanvas
                });
            }
        }

        // Tray background click listener (to cancel held piece when clicking empty space)
        this.trayContainer.addEventListener('pointerdown', (e) => {
            if (this.heldPiece && (e.target === this.trayContainer || e.target.classList.contains('puzzle-tray-panel'))) {
                this.returnHeldPieceToTray();
            }
        });

        // 5. Dynamic Tray Grid Columns based on Grid Size (2x2 to 12x12)
        if (this.gridSize === 2) {
            this.trayContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
            this.trayContainer.style.gap = '14px';
        } else if (this.gridSize === 3) {
            this.trayContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            this.trayContainer.style.gap = '10px';
        } else if (this.gridSize === 4) {
            this.trayContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            this.trayContainer.style.gap = '8px';
        } else if (this.gridSize <= 6) {
            this.trayContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
            this.trayContainer.style.gap = '6px';
        } else if (this.gridSize <= 9) {
            this.trayContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
            this.trayContainer.style.gap = '5px';
        } else {
            this.trayContainer.style.gridTemplateColumns = 'repeat(6, 1fr)';
            this.trayContainer.style.gap = '4px';
        }

        // Shuffle Pieces and Place in Tray
        const shuffled = [...this.pieces].sort(() => Math.random() - 0.5);
        shuffled.forEach(p => {
            this.trayContainer.appendChild(p.element);
            p.element.classList.remove('locked', 'placed', 'dragging', 'selected-held');
            p.element.style.position = '';
            p.element.style.left = '';
            p.element.style.top = '';
            p.element.style.width = '';
            p.element.style.height = '';
        });
    }

    // --- Pointer Drag & Drop / Click-to-Select System ---
    handlePiecePointerDown(e, pieceElem) {
        if (this.isCompleted) return;
        e.preventDefault();
        e.stopPropagation();

        const pieceId = parseInt(pieceElem.dataset.pieceId);
        const clickedPiece = this.pieces.find(p => p.id === pieceId);
        if (!clickedPiece) return;

        // If another piece is already held, return it to tray first
        if (this.heldPiece && this.heldPiece !== clickedPiece) {
            this.returnPieceToTray(this.heldPiece);
            this.heldPiece = null;
        }

        // If clicking the same piece that was already held in click-to-select mode, deselect & return to tray
        if (this.heldPiece === clickedPiece && !this.isPointerDown) {
            this.returnPieceToTray(this.heldPiece);
            this.heldPiece = null;
            this.clearAllGhostOverlays();
            return;
        }

        this.heldPiece = clickedPiece;
        this.isPointerDown = true;
        this.hasDraggedDistance = false;
        this.pointerStartPos = { x: e.clientX, y: e.clientY };

        // Attach directly to the global drag layer on document.body so NO parent container can clip or hide it
        let dragLayer = document.getElementById('puzzle-drag-layer');
        if (!dragLayer) {
            dragLayer = document.createElement('div');
            dragLayer.id = 'puzzle-drag-layer';
            document.body.appendChild(dragLayer);
        }

        // If picked from a board slot, free up that slot
        if (this.heldPiece.currentSlot) {
            this.heldPiece.currentSlot.occupiedPiece = null;
            this.heldPiece.currentSlot = null;
        }

        dragLayer.appendChild(pieceElem);
        pieceElem.classList.remove('placed', 'correct');
        pieceElem.classList.add('dragging', 'selected-held');
        pieceElem.style.position = 'fixed';
        pieceElem.style.width = `${clickedPiece.width}px`;
        pieceElem.style.height = `${clickedPiece.height}px`;
        pieceElem.style.zIndex = '999999';
        pieceElem.style.pointerEvents = 'none';

        // Center piece smoothly on cursor
        this.dragOffset = {
            x: clickedPiece.width / 2,
            y: clickedPiece.height / 2
        };

        this.updateHeldPiecePosition(e.clientX, e.clientY);
        window.sacredAudio.playPieceSnap();
    }

    handlePointerMove(e) {
        if (!this.heldPiece) return;

        // Check if pointer has moved noticeably while pressed (drag gesture)
        if (this.isPointerDown) {
            const dist = Math.hypot(e.clientX - this.pointerStartPos.x, e.clientY - this.pointerStartPos.y);
            if (dist > 8) {
                this.hasDraggedDistance = true;
            }
        }

        this.updateHeldPiecePosition(e.clientX, e.clientY);

        // Highlight nearest slot with realistic jigsaw piece ghost preview
        const hoveredSlot = this.getSlotUnderPointer(e.clientX, e.clientY);
        this.slots.forEach(s => {
            if (s.ghostCanvas && (!s.occupiedPiece || s.occupiedPiece === this.heldPiece)) {
                s.ghostCanvas.style.opacity = '0';
            }
        });

        if (hoveredSlot && (!hoveredSlot.occupiedPiece || hoveredSlot.occupiedPiece === this.heldPiece) && hoveredSlot.ghostCanvas) {
            hoveredSlot.ghostCanvas.style.opacity = '0.75';
        }
    }

    updateHeldPiecePosition(clientX, clientY) {
        if (!this.heldPiece) return;
        const el = this.heldPiece.element;
        el.style.left = `${clientX - this.dragOffset.x}px`;
        el.style.top = `${clientY - this.dragOffset.y}px`;
    }

    handlePointerUp(e) {
        if (!this.heldPiece) return;

        this.isPointerDown = false;

        // Check if pointer was released directly over a slot
        const targetSlot = this.getSlotUnderPointer(e.clientX, e.clientY);

        if (targetSlot) {
            // Attempt to place piece in the slot (returns true ONLY if correct slot)
            const placed = this.placePieceInSlot(this.heldPiece, targetSlot);
            this.moves++;
            const movesEl = document.getElementById('puzzle-moves-count');
            if (movesEl) movesEl.textContent = `${this.moves} Moves`;
            this.heldPiece = null;
            this.clearAllGhostOverlays();
            if (placed) {
                this.checkBoardCompletion();
            }
            return;
        }

        // If user dragged with significant motion (> 35px) and dropped over tray or outside
        const trayRect = this.trayContainer ? this.trayContainer.getBoundingClientRect() : null;
        const isOverTray = trayRect && (
            e.clientX >= trayRect.left - 20 && e.clientX <= trayRect.right + 20 &&
            e.clientY >= trayRect.top - 20 && e.clientY <= trayRect.bottom + 20
        );

        if (this.hasDraggedDistance && isOverTray) {
            // User explicitly dragged and dropped back into tray
            this.returnHeldPieceToTray();
            return;
        }

        // If user tapped/clicked once to select without dragging:
        // KEEP THE PIECE HELD AND VISIBLE! It stays floating with cursor until placed on board!
    }

    handleSlotClick(e, slotDiv) {
        if (this.isCompleted || !this.heldPiece) return;
        e.preventDefault();
        e.stopPropagation();

        const slotIndex = parseInt(slotDiv.dataset.slotIndex);
        const targetSlot = this.slots.find(s => s.index === slotIndex) || this.getSlotUnderPointer(e.clientX, e.clientY);

        if (targetSlot) {
            const placed = this.placePieceInSlot(this.heldPiece, targetSlot);
            this.moves++;
            const movesEl = document.getElementById('puzzle-moves-count');
            if (movesEl) movesEl.textContent = `${this.moves} Moves`;
            this.heldPiece = null;
            this.clearAllGhostOverlays();
            if (placed) {
                this.checkBoardCompletion();
            }
        }
    }

    getSlotUnderPointer(clientX, clientY) {
        if (!this.boardContainer) return null;
        const boardRect = this.boardContainer.getBoundingClientRect();
        const pad = 40;
        if (
            clientX < boardRect.left - pad || clientX > boardRect.right + pad ||
            clientY < boardRect.top - pad || clientY > boardRect.bottom + pad
        ) {
            return null;
        }

        let closestSlot = null;
        let minDistance = Infinity;

        for (const slot of this.slots) {
            const rect = slot.element.getBoundingClientRect();
            const slotCenterX = rect.left + rect.width / 2;
            const slotCenterY = rect.top + rect.height / 2;
            const dist = Math.hypot(clientX - slotCenterX, clientY - slotCenterY);

            // Within generous slot proximity
            if (dist < rect.width * 0.95) {
                if (dist < minDistance) {
                    minDistance = dist;
                    closestSlot = slot;
                }
            }
        }
        return closestSlot;
    }

    placePieceInSlot(piece, targetSlot) {
        const isCorrect = (piece.correctRow === targetSlot.row && piece.correctCol === targetSlot.col);

        if (!isCorrect) {
            // Wrong slot! DO NOT FIX into the slot!
            // Gentle refusal tone
            window.sacredAudio.playTempleBell(280, 0.4);

            // Shake feedback and return to tray
            piece.element.classList.add('shake-wrong');
            setTimeout(() => {
                piece.element.classList.remove('shake-wrong');
                this.returnPieceToTray(piece);
            }, 360);
            return false;
        }

        // Correct slot:
        if (targetSlot.occupiedPiece && targetSlot.occupiedPiece !== piece) {
            this.returnPieceToTray(targetSlot.occupiedPiece);
        }

        targetSlot.occupiedPiece = piece;
        piece.currentSlot = targetSlot;
        this.positionPieceInSlot(piece, targetSlot);

        piece.element.classList.add('correct');
        window.sacredAudio.playPieceSnap();
        return true;
    }

    positionPieceInSlot(piece, slot) {
        piece.element.classList.remove('dragging', 'selected-held');
        piece.element.classList.add('placed');
        this.boardContainer.appendChild(piece.element);
        piece.element.style.position = 'absolute';
        piece.element.style.width = `${piece.width}px`;
        piece.element.style.height = `${piece.height}px`;
        // Position taking pad offset into account
        piece.element.style.left = `${slot.x - piece.pad}px`;
        piece.element.style.top = `${slot.y - piece.pad}px`;
        piece.element.style.zIndex = '10';
        piece.element.style.pointerEvents = 'auto';
    }

    returnPieceToTray(piece) {
        if (piece.currentSlot) {
            piece.currentSlot.occupiedPiece = null;
            piece.currentSlot = null;
        }
        piece.element.classList.remove('placed', 'correct', 'dragging', 'selected-held', 'shake-wrong');
        piece.element.style.position = '';
        piece.element.style.left = '';
        piece.element.style.top = '';
        piece.element.style.width = '';
        piece.element.style.height = '';
        piece.element.style.zIndex = '';
        piece.element.style.pointerEvents = 'auto';
        this.trayContainer.appendChild(piece.element);
    }

    returnHeldPieceToTray() {
        if (this.heldPiece) {
            this.returnPieceToTray(this.heldPiece);
            this.heldPiece = null;
        }
        this.clearAllGhostOverlays();
    }

    clearAllGhostOverlays() {
        this.slots.forEach(s => {
            if (s.ghostCanvas) s.ghostCanvas.style.opacity = '0';
        });
    }

    toggleHint() {
        this.isGhostHintActive = !this.isGhostHintActive;
        const hintBtn = document.getElementById('puzzle-hint-btn');

        if (this.hintOverlay) {
            this.hintOverlay.style.opacity = this.isGhostHintActive ? '0.62' : '0';
        }

        if (this.isGhostHintActive) {
            this.boardContainer.classList.add('ghost-hint-on');
            if (hintBtn) {
                hintBtn.classList.add('active');
                hintBtn.innerHTML = '<span class="btn-emoji">💡</span> Hint ON';
            }
            window.sacredAudio.playTempleBell(980, 1.2);
        } else {
            this.boardContainer.classList.remove('ghost-hint-on');
            if (hintBtn) {
                hintBtn.classList.remove('active');
                hintBtn.innerHTML = '<span class="btn-emoji">💡</span> Hint';
            }
        }
    }

    // --- Completion & Decision Modal ---
    checkBoardCompletion() {
        let correctCount = 0;
        const total = this.gridSize * this.gridSize;

        for (const slot of this.slots) {
            if (slot.occupiedPiece) {
                const p = slot.occupiedPiece;
                if (p.correctRow === slot.row && p.correctCol === slot.col) {
                    correctCount++;
                }
            }
        }

        if (correctCount === total && !this.isCompleted) {
            this.onLevelCompleted();
        }
    }

    onLevelCompleted() {
        this.isCompleted = true;
        this.stopTimer();

        // Calculate stars dynamically based on total pieces (2x2=4 up to 12x12=144 pieces)
        const totalPieces = this.gridSize * this.gridSize;
        const baseTime = Math.max(60, totalPieces * 4); // Generous time budget per piece
        let stars = 3;
        if (this.elapsedSeconds > baseTime * 2 || this.moves > totalPieces * 4) {
            stars = 1;
        } else if (this.elapsedSeconds > baseTime || this.moves > totalPieces * 2.5) {
            stars = 2;
        }

        const scoreEarned = window.progressTracker.recordPuzzleCompletion(
            this.currentLevel, this.elapsedSeconds, this.moves, stars
        );

        // Seamless Master Darshan Reveal: Create unified completed canvas covering board with zero lines
        const boardSize = Math.min(this.boardContainer.clientWidth || 440, 460);
        let revealCanvas = this.boardContainer.querySelector('.puzzle-board-complete-reveal');
        if (!revealCanvas) {
            revealCanvas = document.createElement('canvas');
            revealCanvas.width = boardSize;
            revealCanvas.height = boardSize;
            revealCanvas.className = 'puzzle-board-complete-reveal';
            const rCtx = revealCanvas.getContext('2d');
            rCtx.drawImage(this.offscreenMurtiCanvas, 0, 0, boardSize, boardSize);
            this.boardContainer.appendChild(revealCanvas);
        }

        // Add completed class to trigger smooth transition (puzzle lines dissolve, pure Murti emerges)
        this.boardContainer.classList.add('puzzle-board-completed');

        // Audio & Visual Fanfare
        window.sacredAudio.playSuccessFanfare();
        window.sacredAudio.playTempleBell(660, 2.5);
        this.triggerFlowerConfetti();

        // Open Decision Modal after small celebration delay
        setTimeout(() => {
            this.showCompletionModal(stars, scoreEarned);
        }, 1400);
    }

    triggerFlowerConfetti() {
        const container = document.getElementById('festival-effects-overlay');
        if (!container) return;

        const colors = ['#ff7700', '#ffd700', '#e81123', '#ffffff', '#ff9ff3'];
        for (let i = 0; i < 40; i++) {
            const petal = document.createElement('div');
            petal.className = 'celebration-petal';
            petal.style.left = `${Math.random() * 100}%`;
            petal.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            petal.style.animationDuration = `${1.5 + Math.random() * 2}s`;
            petal.style.animationDelay = `${Math.random() * 0.5}s`;
            container.appendChild(petal);

            setTimeout(() => petal.remove(), 4000);
        }
    }

    showCompletionModal(stars, scoreEarned) {
        const modal = document.getElementById('puzzle-complete-modal');
        if (!modal) return;

        const titleEl = document.getElementById('pcm-title');
        const statsEl = document.getElementById('pcm-stats');
        const starsEl = document.getElementById('pcm-stars');
        const blessingEl = document.getElementById('pcm-blessing');

        if (titleEl) titleEl.textContent = `Level ${this.currentLevel} Completed!`;
        if (statsEl) statsEl.innerHTML = `⏱ Time: <b>${this.elapsedSeconds}s</b> | 🎯 Moves: <b>${this.moves}</b> | ✨ Points: <b>+${scoreEarned}</b>`;
        if (starsEl) starsEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        if (blessingEl) blessingEl.textContent = `"${this.idolData.blessing}"`;

        modal.classList.add('active');

        // Modal Action: "Next Level"
        const nextBtn = document.getElementById('pcm-next-puzzle-btn');
        if (nextBtn) {
            nextBtn.onclick = () => {
                modal.classList.remove('active');
                if (this.currentLevel < 500) {
                    this.loadLevel(this.currentLevel + 1);
                } else {
                    alert("Divine Congratulations! You have conquered all 500 Ganesha Puzzles!");
                }
            };
        }

        // Modal Action: "Replay This Level"
        const replayBtn = document.getElementById('pcm-replay-puzzle-btn');
        if (replayBtn) {
            replayBtn.onclick = () => {
                modal.classList.remove('active');
                this.loadLevel(this.currentLevel);
            };
        }

        // Modal Action: "Open 500 Levels Road Map"
        const roadmapBtn = document.getElementById('pcm-roadmap-puzzle-btn');
        if (roadmapBtn) {
            roadmapBtn.onclick = () => {
                modal.classList.remove('active');
                window.mainApp.openLevelSelectorModal('puzzle');
            };
        }

        // Modal Action: "Puzzle + Nimarjanam"
        const visarjanBtn = document.getElementById('pcm-visarjan-btn');
        if (visarjanBtn) {
            visarjanBtn.onclick = () => {
                modal.classList.remove('active');
                // Switch to Game 3 (Nimarjanam) with this specific completed idol
                window.mainApp.switchMode('nimarjanam', {
                    idolData: this.idolData,
                    fromMode: 'puzzle',
                    nextLevel: this.currentLevel < 500 ? this.currentLevel + 1 : 1
                });
            };
        }
    }
}

// Global puzzle game instance
window.puzzleGame = new PuzzleGame();
