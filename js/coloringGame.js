/**
 * Game 2: Ganesha Murti Coloring & Painting Engine
 * Converts 12 Photorealistic Ganesha Idol Sculptures into high-definition realistic
 * coloring book sketches across all 500 levels, with tap-to-fill (Flood Fill),
 * freehand brush painting, eraser, comprehensive color palettes + custom color picker,
 * undo/redo history, Aarti mode, PNG photo download, and holy river Visarjan integration.
 */

class ColoringGame {
    constructor() {
        this.currentLevel = 1;
        this.idolData = null;
        this.canvas = null;
        this.ctx = null;

        // Realistic image cache and preprocessed line-art cache
        this.outlineCache = {};
        this.loadedImages = {};

        // Tool state
        this.selectedTool = 'bucket'; // 'bucket', 'brush', 'eraser'
        this.selectedColor = '#ff6f00'; // Default Sacred Saffron
        this.brushSize = 10; // 4, 10, 22

        // History for Undo / Redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;

        // Aarti state
        this.isAartiActive = false;
        this.aartiInterval = null;

        // Interaction state
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        this.setupPalettes();
    }

    init() {
        this.canvas = document.getElementById('coloring-canvas') || document.getElementById('dressup-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            this.canvas.width = 600;
            this.canvas.height = 600;
        }

        this.currentLevel = window.progressTracker ? window.progressTracker.getDressUpCurrentLevel() : 1;
        this.setupPalettes();
        this.preloadColoringImages();
        this.bindEvents();
        this.startLevel(this.currentLevel);
    }

    setupPalettes() {
        this.palettes = {
            sacred: [
                { name: 'Sacred Saffron', hex: '#ff6f00' },
                { name: 'Sindoor Red', hex: '#d50000' },
                { name: 'Turmeric Gold', hex: '#ffd700' },
                { name: 'Chandan Sandalwood', hex: '#e0a96d' },
                { name: 'Holy Gangajal Blue', hex: '#0288d1' },
                { name: 'Sacred Tulsi Green', hex: '#2e7d32' },
                { name: 'Pink Lotus Blossom', hex: '#ff4081' },
                { name: 'Velvet Maroon', hex: '#880e4f' },
                { name: 'Kashi Ochre', hex: '#bf360c' },
                { name: 'Pristine White', hex: '#ffffff' }
            ],
            royal: [
                { name: '24K Pure Gold', hex: '#ffd700' },
                { name: 'Warm Amber Gold', hex: '#e5a912' },
                { name: 'Shimmer Silver', hex: '#cfd8dc' },
                { name: 'Antique Bronze', hex: '#cd7f32' },
                { name: 'Deep Copper', hex: '#b87333' },
                { name: 'Pearl Glow', hex: '#fffde7' }
            ],
            rainbow: [
                { name: 'Ruby Red', hex: '#b71c1c' },
                { name: 'Bright Crimson', hex: '#e53935' },
                { name: 'Coral Orange', hex: '#ff7043' },
                { name: 'Deep Orange', hex: '#f57c00' },
                { name: 'Golden Amber', hex: '#ffc107' },
                { name: 'Lemon Yellow', hex: '#ffeb3b' },
                { name: 'Lime Green', hex: '#cddc39' },
                { name: 'Spring Green', hex: '#8bc34a' },
                { name: 'Emerald Green', hex: '#00c853' },
                { name: 'Teal Blue', hex: '#009688' },
                { name: 'Sky Cyan', hex: '#00bcd4' },
                { name: 'Vibrant Blue', hex: '#2196f3' },
                { name: 'Royal Indigo', hex: '#3f51b5' },
                { name: 'Deep Purple', hex: '#673ab7' },
                { name: 'Magenta Orchid', hex: '#9c27b0' },
                { name: 'Rose Pink', hex: '#e91e63' },
                { name: 'Warm Brown', hex: '#795548' },
                { name: 'Dark Earth', hex: '#4e342e' },
                { name: 'Slate Gray', hex: '#78909c' },
                { name: 'Midnight Charcoal', hex: '#263238' }
            ]
        };
    }

    bindEvents() {
        // Tool Buttons
        const bucketBtn = document.getElementById('tool-bucket-btn');
        const brushBtn = document.getElementById('tool-brush-btn');
        const eraserBtn = document.getElementById('tool-eraser-btn');
        const undoBtn = document.getElementById('coloring-undo-btn');
        const redoBtn = document.getElementById('coloring-redo-btn');
        const clearBtn = document.getElementById('coloring-clear-btn');
        const magicBtn = document.getElementById('coloring-magic-btn');
        const aartiBtn = document.getElementById('coloring-aarti-btn') || document.getElementById('dressup-aarti-btn');
        const downloadBtn = document.getElementById('coloring-download-btn') || document.getElementById('dressup-download-btn');
        const finishBtn = document.getElementById('coloring-finish-btn') || document.getElementById('dressup-finish-btn');
        const customColorInput = document.getElementById('custom-color-picker');

        if (bucketBtn) bucketBtn.onclick = () => this.setTool('bucket');
        if (brushBtn) brushBtn.onclick = () => this.setTool('brush');
        if (eraserBtn) eraserBtn.onclick = () => this.setTool('eraser');
        if (undoBtn) undoBtn.onclick = () => this.undo();
        if (redoBtn) redoBtn.onclick = () => this.redo();
        if (clearBtn) clearBtn.onclick = () => this.clearCanvas();
        if (magicBtn) magicBtn.onclick = () => this.applyMagicColoring();
        if (aartiBtn) aartiBtn.onclick = () => this.toggleAartiMode();
        if (downloadBtn) downloadBtn.onclick = () => this.downloadArtwork();
        if (finishBtn) finishBtn.onclick = () => this.finishColoring();

        if (customColorInput) {
            customColorInput.oninput = (e) => this.setColor(e.target.value);
        }

        // Brush Size Selector Buttons
        const sizeBtns = document.querySelectorAll('.brush-size-btn');
        sizeBtns.forEach(btn => {
            btn.onclick = () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushSize = parseInt(btn.dataset.size) || 10;
                if (window.sacredAudio) window.sacredAudio.playPieceSnap();
            };
        });

        // Setup Canvas Pointer/Touch Events
        this.setupCanvasInteractions();
    }

    setupCanvasInteractions() {
        if (!this.canvas) return;

        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: Math.round((clientX - rect.left) * scaleX),
                y: Math.round((clientY - rect.top) * scaleY)
            };
        };

        const handlePointerDown = (e) => {
            e.preventDefault();
            const pos = getPos(e);

            if (this.selectedTool === 'bucket') {
                this.floodFill(pos.x, pos.y, this.selectedColor);
            } else {
                this.isDrawing = true;
                this.lastX = pos.x;
                this.lastY = pos.y;
                this.drawBrushStroke(pos.x, pos.y, true);
            }
        };

        const handlePointerMove = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.drawBrushStroke(pos.x, pos.y, false);
            this.lastX = pos.x;
            this.lastY = pos.y;
        };

        const handlePointerUp = () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.redrawOutlineOverlay();
                this.saveHistoryState();
            }
        };

        this.canvas.addEventListener('mousedown', handlePointerDown);
        this.canvas.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);

        this.canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
        this.canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
        window.addEventListener('touchend', handlePointerUp);
    }

    loadLevel(levelNumber) {
        this.currentLevel = Math.max(1, Math.min(500, parseInt(levelNumber) || 1));
        if (window.progressTracker) window.progressTracker.setDressUpCurrentLevel(this.currentLevel);
        this.startLevel(this.currentLevel);
    }

    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.idolData = window.ganeshaCatalog ? window.ganeshaCatalog.getIdol(this.currentLevel) : { id: 1, title: 'Lord Ganesha', archetypeName: 'Lalbaugcha Raja', imageSrc: 'assets/images/lalbaug.jpg' };
        
        if (!this.canvas) {
            this.canvas = document.getElementById('coloring-canvas') || document.getElementById('dressup-canvas');
        }
        if (this.canvas) {
            if (!this.ctx) {
                this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
            }
            this.canvas.width = 600;
            this.canvas.height = 600;
        }

        this.history = [];
        this.historyIndex = -1;
        this.isAartiActive = false;
        if (this.aartiInterval) clearInterval(this.aartiInterval);

        this.updateHeaderUI();
        this.renderPalettesUI();
        this.drawRealisticIdolLineArt();
    }

    updateHeaderUI() {
        const titleEl = document.getElementById('dressup-level-title') || document.getElementById('coloring-level-title');
        const subEl = document.getElementById('dressup-level-subtitle') || document.getElementById('coloring-level-subtitle');
        if (titleEl) titleEl.textContent = `Coloring Murti ${this.currentLevel}/500: ${this.idolData.title || 'Shree Ganesha'}`;
        if (subEl) subEl.textContent = `Swaroop: ${this.idolData.archetypeName || 'Lord Ganesha'} • Tap any area to fill color!`;
    }

    setTool(tool) {
        this.selectedTool = tool;
        const bucketBtn = document.getElementById('tool-bucket-btn');
        const brushBtn = document.getElementById('tool-brush-btn');
        const eraserBtn = document.getElementById('tool-eraser-btn');

        if (bucketBtn) bucketBtn.classList.toggle('active', tool === 'bucket');
        if (brushBtn) brushBtn.classList.toggle('active', tool === 'brush');
        if (eraserBtn) eraserBtn.classList.toggle('active', tool === 'eraser');

        if (window.sacredAudio) window.sacredAudio.playPieceSnap();
    }

    setColor(hex) {
        this.selectedColor = hex;
        const previewCircle = document.getElementById('current-color-preview');
        const hexText = document.getElementById('current-color-hex');
        const customInput = document.getElementById('custom-color-picker');

        if (previewCircle) previewCircle.style.backgroundColor = hex;
        if (hexText) hexText.textContent = hex.toUpperCase();
        if (customInput) customInput.value = hex;

        if (this.selectedTool === 'eraser') {
            this.setTool('bucket');
        }

        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(s => {
            s.classList.toggle('active', s.dataset.color && s.dataset.color.toLowerCase() === hex.toLowerCase());
        });

        if (window.sacredAudio) window.sacredAudio.playPieceSnap();
    }

    renderPalettesUI() {
        const grid = document.getElementById('wardrobe-items-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="coloring-palette-container">
                
                <!-- Active Color Display & Picker -->
                <div class="active-color-banner">
                    <div id="current-color-preview" class="active-color-disc" style="background-color: ${this.selectedColor};"></div>
                    <div class="active-color-meta">
                        <span class="ac-label">Selected Color</span>
                        <span id="current-color-hex" class="ac-hex">${this.selectedColor.toUpperCase()}</span>
                    </div>
                    <label class="custom-picker-btn" title="Choose ANY color from 16M colors">
                        🌈 Custom Picker
                        <input type="color" id="custom-color-picker" value="${this.selectedColor}">
                    </label>
                </div>

                <!-- Sacred Temple Palette -->
                <div class="palette-section-block">
                    <div class="palette-title">🪔 Sacred Divine Palette</div>
                    <div class="swatches-grid">
                        ${this.palettes.sacred.map(c => `
                            <button class="color-swatch ${c.hex.toLowerCase() === this.selectedColor.toLowerCase() ? 'active' : ''}"
                                    data-color="${c.hex}"
                                    title="${c.name}"
                                    style="background-color: ${c.hex};"
                                    onclick="window.dressupGame.setColor('${c.hex}')">
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 24K Royal Metallics -->
                <div class="palette-section-block">
                    <div class="palette-title">👑 24K Royal Gold & Metallics</div>
                    <div class="swatches-grid">
                        ${this.palettes.royal.map(c => `
                            <button class="color-swatch ${c.hex.toLowerCase() === this.selectedColor.toLowerCase() ? 'active' : ''}"
                                    data-color="${c.hex}"
                                    title="${c.name}"
                                    style="background-color: ${c.hex};"
                                    onclick="window.dressupGame.setColor('${c.hex}')">
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Vibrant Full Rainbow -->
                <div class="palette-section-block">
                    <div class="palette-title">🎨 Full Rainbow Spectrum</div>
                    <div class="swatches-grid">
                        ${this.palettes.rainbow.map(c => `
                            <button class="color-swatch ${c.hex.toLowerCase() === this.selectedColor.toLowerCase() ? 'active' : ''}"
                                    data-color="${c.hex}"
                                    title="${c.name}"
                                    style="background-color: ${c.hex};"
                                    onclick="window.dressupGame.setColor('${c.hex}')">
                            </button>
                        `).join('')}
                    </div>
                </div>

            </div>
        `;

        const customPicker = document.getElementById('custom-color-picker');
        if (customPicker) {
            customPicker.oninput = (e) => this.setColor(e.target.value);
        }
    }

    /**
     * Preloads all 12 authentic Ganesha coloring book archetypes for instant switching
     */
    preloadColoringImages() {
        if (!window.VIGRAHAM_ARCHETYPES) return;
        window.VIGRAHAM_ARCHETYPES.forEach(arch => {
            if (arch.coloringImageSrc && !this.loadedImages[arch.coloringImageSrc]) {
                const img = new Image();
                img.onload = () => {
                    this.loadedImages[arch.coloringImageSrc] = img;
                    this.prepareCleanLineArtData(arch.coloringImageSrc, img);
                };
                img.src = arch.coloringImageSrc;
            }
        });
    }

    /**
     * Prepares and caches clean high-definition line art with deep black contours and pure white background
     */
    prepareCleanLineArtData(src, img) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 600;
        offCanvas.height = 600;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, 600, 600);

        // Center and scale image with 10px margin
        const pad = 12;
        const dw = 600 - pad * 2;
        const dh = 600 - pad * 2;
        offCtx.drawImage(img, pad, pad, dw, dh);

        const imgData = offCtx.getImageData(0, 0, 600, 600);
        const data = imgData.data;

        // Enhance line contrast: deep black contours, pure white fills, smooth antialiasing
        for (let i = 0; i < 600 * 600; i++) {
            const idx = i * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 155) {
                // Crisp black line
                const v = Math.round(lum * 0.4);
                data[idx] = v;
                data[idx + 1] = v;
                data[idx + 2] = v;
            } else if (lum > 225) {
                // Pure clean white
                data[idx] = 255;
                data[idx + 1] = 255;
                data[idx + 2] = 255;
            } else {
                // Smooth antialiased gradient
                const norm = (lum - 155) / (225 - 155);
                const v = Math.round(norm * 255);
                data[idx] = v;
                data[idx + 1] = v;
                data[idx + 2] = v;
            }
            data[idx + 3] = 255;
        }

        offCtx.putImageData(imgData, 0, 0);
        this.outlineCache[src] = imgData;
        return imgData;
    }

    /**
     * Draws the authentic high-definition coloring book line art for the active level
     */
    drawRealisticIdolLineArt() {
        if (!this.canvas) {
            this.canvas = document.getElementById('coloring-canvas') || document.getElementById('dressup-canvas');
        }
        if (this.canvas && !this.ctx) {
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
        if (!this.canvas || !this.ctx) return;

        const w = this.canvas.width = 600;
        const h = this.canvas.height = 600;
        const ctx = this.ctx;

        const coloringSrc = (this.idolData && this.idolData.coloringImageSrc) 
            ? this.idolData.coloringImageSrc 
            : 'assets/images/coloring_lalbaug.jpg';

        if (this.outlineCache[coloringSrc]) {
            ctx.putImageData(this.outlineCache[coloringSrc], 0, 0);
            this.saveHistoryState();
            this.updateUndoRedoUI();
            return;
        }

        // Show auspicious darshan title briefly
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ff6f00';
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('॥ श्री गणेशाय नमः ॥', w / 2, h / 2 - 20);
        ctx.font = '15px "Outfit", sans-serif';
        ctx.fillStyle = '#6d4c41';
        ctx.fillText(`Loading ${this.idolData.archetypeName || 'Lord Ganesha'}...`, w / 2, h / 2 + 15);

        const img = new Image();
        img.onload = () => {
            this.loadedImages[coloringSrc] = img;
            const cleanData = this.prepareCleanLineArtData(coloringSrc, img);
            ctx.putImageData(cleanData, 0, 0);
            this.saveHistoryState();
            this.updateUndoRedoUI();
        };
        img.onerror = () => {
            // Fallback to first high-definition coloring image if any network glitch
            if (coloringSrc !== 'assets/images/coloring_lalbaug.jpg') {
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                    const cleanData = this.prepareCleanLineArtData('assets/images/coloring_lalbaug.jpg', fallbackImg);
                    ctx.putImageData(cleanData, 0, 0);
                    this.saveHistoryState();
                    this.updateUndoRedoUI();
                };
                fallbackImg.src = 'assets/images/coloring_lalbaug.jpg';
            }
        };
        img.src = coloringSrc;
    }

    redrawOutlineOverlay() {
        const coloringSrc = (this.idolData && this.idolData.coloringImageSrc) 
            ? this.idolData.coloringImageSrc 
            : 'assets/images/coloring_lalbaug.jpg';
        const cached = this.outlineCache[coloringSrc];
        if (!cached || !this.ctx) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const imgData = this.ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const outlineData = cached.data;

        // Multiply dark outline contours back over the painted color canvas
        for (let i = 0; i < w * h; i++) {
            const idx = i * 4;
            const outlineVal = outlineData[idx]; // Grayscale line (0 = black line, 255 = white background)
            if (outlineVal < 210) {
                const factor = outlineVal / 255.0;
                data[idx] = Math.round(data[idx] * factor);
                data[idx + 1] = Math.round(data[idx + 1] * factor);
                data[idx + 2] = Math.round(data[idx + 2] * factor);
            }
        }

        this.ctx.putImageData(imgData, 0, 0);
    }

    floodFill(startX, startY, fillColorHex) {
        if (!this.canvas || !this.ctx) return;

        const w = this.canvas.width;
        const h = this.canvas.height;

        if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

        const imgData = this.ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const targetColor = this.getPixelColor(data, startX, startY, w);
        const fillColor = this.hexToRgb(fillColorHex);

        if (this.isBlackBoundary(targetColor) || this.colorsMatch(targetColor, fillColor, 10)) {
            return;
        }

        const tolerance = 48;
        const pixelStack = [[startX, startY]];
        const visited = new Uint8Array(w * h);

        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop();
            let currentY = y;
            let idx = (currentY * w + x);

            while (currentY >= 0 && this.matchTarget(data, x, currentY, w, targetColor, tolerance) && !visited[idx]) {
                currentY--;
                idx -= w;
            }

            currentY++;
            idx += w;

            let spanLeft = false;
            let spanRight = false;

            while (currentY < h && this.matchTarget(data, x, currentY, w, targetColor, tolerance) && !visited[idx]) {
                visited[idx] = 1;
                this.setPixelColor(data, idx, fillColor);

                if (x > 0) {
                    const leftMatch = this.matchTarget(data, x - 1, currentY, w, targetColor, tolerance);
                    if (leftMatch && !spanLeft && !visited[idx - 1]) {
                        pixelStack.push([x - 1, currentY]);
                        spanLeft = true;
                    } else if (!leftMatch) {
                        spanLeft = false;
                    }
                }

                if (x < w - 1) {
                    const rightMatch = this.matchTarget(data, x + 1, currentY, w, targetColor, tolerance);
                    if (rightMatch && !spanRight && !visited[idx + 1]) {
                        pixelStack.push([x + 1, currentY]);
                        spanRight = true;
                    } else if (!rightMatch) {
                        spanRight = false;
                    }
                }

                currentY++;
                idx += w;
            }
        }

        this.ctx.putImageData(imgData, 0, 0);
        this.redrawOutlineOverlay();
        this.saveHistoryState();

        if (window.sacredAudio) {
            window.sacredAudio.playPieceSnap();
            window.sacredAudio.playTempleBell(980, 0.4);
        }
    }

    getPixelColor(data, x, y, w) {
        const idx = (y * w + x) * 4;
        return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    }

    setPixelColor(data, idx, color) {
        const i = idx * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = 255;
    }

    matchTarget(data, x, y, w, target, tolerance) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r < 65 && g < 65 && b < 65) return false;

        const diff = Math.abs(r - target[0]) + Math.abs(g - target[1]) + Math.abs(b - target[2]);
        return diff <= tolerance * 3;
    }

    isBlackBoundary(color) {
        return color[0] < 65 && color[1] < 65 && color[2] < 65;
    }

    colorsMatch(c1, c2, tol) {
        return Math.abs(c1[0] - c2[0]) <= tol && Math.abs(c1[1] - c2[1]) <= tol && Math.abs(c1[2] - c2[2]) <= tol;
    }

    hexToRgb(hex) {
        let clean = hex.replace('#', '');
        if (clean.length === 3) {
            clean = clean.split('').map(ch => ch + ch).join('');
        }
        const num = parseInt(clean, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    }

    drawBrushStroke(x, y, isStart) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = this.selectedTool === 'eraser' ? '#ffffff' : this.selectedColor;
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (isStart) {
            ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        } else {
            ctx.moveTo(this.lastX, this.lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // =========================================================================
    // HISTORY (UNDO / REDO)
    // =========================================================================
    saveHistoryState() {
        if (!this.canvas || !this.ctx) return;
        const snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(snapshot);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;

        this.updateUndoRedoUI();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.ctx.putImageData(state, 0, 0);
            this.updateUndoRedoUI();
            if (window.sacredAudio) window.sacredAudio.playPieceSnap();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.ctx.putImageData(state, 0, 0);
            this.updateUndoRedoUI();
            if (window.sacredAudio) window.sacredAudio.playPieceSnap();
        }
    }

    clearCanvas() {
        const coloringSrc = (this.idolData && this.idolData.coloringImageSrc) 
            ? this.idolData.coloringImageSrc 
            : 'assets/images/coloring_lalbaug.jpg';
        if (this.outlineCache[coloringSrc]) {
            this.ctx.putImageData(this.outlineCache[coloringSrc], 0, 0);
        } else {
            this.drawRealisticIdolLineArt();
        }
        this.saveHistoryState();
        if (window.sacredAudio) window.sacredAudio.playPieceSnap();
    }

    updateUndoRedoUI() {
        const undoBtn = document.getElementById('coloring-undo-btn');
        const redoBtn = document.getElementById('coloring-redo-btn');
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    applyMagicColoring() {
        const cx = this.canvas.width * 0.50;

        // Apply authentic sacred colors to the realistic sculpture regions
        this.floodFill(cx, 130, '#ffd700'); // Crown 24K Gold
        this.floodFill(cx, 220, '#ffd700'); // Mukut Base Gold
        this.floodFill(cx, 280, '#ff6f00'); // Face Sacred Saffron
        this.floodFill(cx, 330, '#ff6f00'); // Trunk Saffron
        this.floodFill(cx - 110, 260, '#ff6f00'); // Left Ear Saffron
        this.floodFill(cx + 110, 260, '#ff6f00'); // Right Ear Saffron
        this.floodFill(cx, 380, '#ff6f00'); // Sacred Chest & Belly
        this.floodFill(cx, 440, '#d50000'); // Royal Dhoti Crimson Red
        this.floodFill(cx - 90, 430, '#d50000'); // Left Leg Silk
        this.floodFill(cx + 90, 430, '#d50000'); // Right Leg Silk
        this.floodFill(cx, 470, '#ffd700'); // Golden Dhoti Border
        this.floodFill(cx, 510, '#ff4081'); // Lotus Asana Pink
        this.floodFill(cx - 80, 510, '#ff4081'); // Lotus Petal Left
        this.floodFill(cx + 80, 510, '#ff4081'); // Lotus Petal Right
        this.floodFill(cx, 560, '#880e4f'); // Pedestal Velvet Maroon
        this.floodFill(40, 40, '#fff8e1'); // Sacred Sanctum Aura Cream

        if (window.sacredAudio) {
            window.sacredAudio.playSuccessFanfare();
            window.sacredAudio.playTempleBell(1046, 1.5);
        }
    }

    toggleAartiMode() {
        this.isAartiActive = !this.isAartiActive;
        const aartiOverlay = document.getElementById('aarti-flame-overlay');
        const aartiBtn = document.getElementById('coloring-aarti-btn') || document.getElementById('dressup-aarti-btn');

        if (this.isAartiActive) {
            if (aartiOverlay) aartiOverlay.classList.add('active');
            if (aartiBtn) aartiBtn.classList.add('active');
            if (window.sacredAudio) {
                window.sacredAudio.playShankha(3.2);
                window.sacredAudio.playTempleBell(660, 3.0);
            }

            let angle = 0;
            this.aartiInterval = setInterval(() => {
                angle += 0.08;
                const ax = 50 + Math.cos(angle) * 18;
                const ay = 50 + Math.sin(angle) * 12;
                if (aartiOverlay) {
                    aartiOverlay.style.left = `${ax}%`;
                    aartiOverlay.style.top = `${ay}%`;
                }
                if (Math.random() < 0.15 && window.sacredAudio) {
                    window.sacredAudio.playTempleBell(880 + Math.random() * 200, 1.2);
                }
            }, 50);
        } else {
            if (aartiOverlay) aartiOverlay.classList.remove('active');
            if (aartiBtn) aartiBtn.classList.remove('active');
            if (this.aartiInterval) clearInterval(this.aartiInterval);
        }
    }

    finishColoring() {
        if (this.isAartiActive) this.toggleAartiMode();

        if (window.progressTracker) {
            window.progressTracker.recordDressUpCompletion(
                this.currentLevel,
                10,
                []
            );
        }

        if (window.sacredAudio) {
            window.sacredAudio.playSuccessFanfare();
            window.sacredAudio.playShankha(2.5);
        }

        this.showCompletionModal();
    }

    showCompletionModal() {
        const modal = document.getElementById('dressup-complete-modal');
        if (!modal) return;

        const titleEl = document.getElementById('dcm-title');
        const statsEl = document.getElementById('dcm-stats');
        const blessingEl = document.getElementById('dcm-blessing');

        if (titleEl) titleEl.textContent = `Murti Painting Completed! (Level ${this.currentLevel}/500)`;
        if (statsEl) statsEl.innerHTML = `🎨 Beautifully colored sacred <b>${this.idolData.archetypeName || 'Lord Ganesha'}</b> murti with divine colors!`;
        if (blessingEl) blessingEl.textContent = `"${this.idolData.blessing || 'May Lord Ganesha bring endless joy and prosperity!'}"`;

        modal.classList.add('active');

        const nextBtn = document.getElementById('dcm-next-dressup-btn');
        if (nextBtn) {
            nextBtn.textContent = '🎨 Next Murti ▶';
            nextBtn.onclick = () => {
                modal.classList.remove('active');
                if (this.currentLevel < 500) {
                    this.loadLevel(this.currentLevel + 1);
                } else {
                    alert("Grand Blessings! You have painted all 500 sacred Ganesha idols!");
                }
            };
        }

        const replayBtn = document.getElementById('dcm-replay-dressup-btn');
        if (replayBtn) {
            replayBtn.onclick = () => {
                modal.classList.remove('active');
                this.loadLevel(this.currentLevel);
            };
        }

        const roadmapBtn = document.getElementById('dcm-roadmap-dressup-btn');
        if (roadmapBtn) {
            roadmapBtn.onclick = () => {
                modal.classList.remove('active');
                window.mainApp.openLevelSelectorModal('dressup');
            };
        }

        const visarjanBtn = document.getElementById('dcm-visarjan-btn');
        if (visarjanBtn) {
            visarjanBtn.textContent = '🌊 Painted Murti Visarjan →';
            visarjanBtn.onclick = () => {
                modal.classList.remove('active');
                window.mainApp.switchMode('nimarjanam', {
                    idolData: this.idolData,
                    paintedCanvas: this.canvas,
                    fromMode: 'dressup',
                    nextLevel: this.currentLevel < 500 ? this.currentLevel + 1 : 1
                });
            };
        }
    }

    downloadArtwork() {
        if (!this.canvas) return;
        const link = document.createElement('a');
        link.download = `Ganesha_Coloring_Murti_${this.currentLevel}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        if (window.sacredAudio) window.sacredAudio.playTempleBell(1046, 1.5);
    }
}

// Global coloring game instance
window.coloringGame = new ColoringGame();
window.dressupGame = window.coloringGame;

