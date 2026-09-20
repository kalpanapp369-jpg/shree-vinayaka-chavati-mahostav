/**
 * Murti Rendering Engine (Photorealistic Image & Anatomical Sringar Layers)
 * Renders high-definition real Ganesha Vigrahams with sacred temple lighting,
 * dynamic holy auras, 12 distinct base unadorned sculptures across 500 levels,
 * and authentic anatomical Barbie-doll style dress-up layers (Crowns, Dhotis, Malas,
 * Jewelry, Tilaks, and Altar Offerings) that fit the idol's body with precision.
 */

class MurtiRenderer {
    constructor() {
        this.imageCache = new Map();
        this.preloadAllImages();
    }

    preloadAllImages() {
        const imagePaths = [
            'assets/images/lalbaug.jpg',
            'assets/images/dagdusheth.jpg',
            'assets/images/bal_ganesh.jpg',
            'assets/images/marble.jpg',
            'assets/images/siddhivinayak.jpg',
            'assets/images/terracotta.jpg',
            'assets/images/plain_marble.jpg',
            'assets/images/panchamukhi.jpg',
            'assets/images/mayureshwar.jpg',
            'assets/images/nritya.jpg',
            'assets/images/tanjore.jpg',
            'assets/images/chola_bronze.jpg',
            'assets/images/sphatik.jpg'
        ];

        imagePaths.forEach(src => {
            if (typeof Image !== 'undefined') {
                const img = new Image();
                img.src = src;
                this.imageCache.set(src, img);
            }
        });
    }

    getImage(src) {
        if (!src) return null;
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }
        if (typeof Image !== 'undefined') {
            const img = new Image();
            img.src = src;
            this.imageCache.set(src, img);
            return img;
        }
        return null;
    }

    renderToCanvas(canvas, idolData, options = {}) {
        return new Promise((resolve) => {
            if (!canvas || !idolData) {
                resolve();
                return;
            }

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);
            ctx.save();

            const isPlain = options.isPlain || false;
            const showBackdrop = options.showBackdrop !== undefined ? options.showBackdrop : !isPlain;
            const customItems = options.customItems || [];

            // In Dress-Up mode: render the base plain idol, then dress it up with fitted costume layers
            let imgSrc = idolData.imageSrc || 'assets/images/lalbaug.jpg';
            if (isPlain) {
                imgSrc = idolData.plainImageSrc || 'assets/images/terracotta.jpg';
            }

            const img = this.getImage(imgSrc);

            let isResolved = false;
            const finish = () => {
                if (!isResolved) {
                    isResolved = true;
                    ctx.restore();
                    resolve();
                }
            };

            // Hard safety timeout: guaranteed resolution within 350ms max
            const safetyTimer = setTimeout(() => {
                this.drawLoadingAura(ctx, width, height);
                finish();
            }, 350);

            if (!img || img.complete) {
                clearTimeout(safetyTimer);
                if (img && img.naturalWidth > 0) {
                    this.drawCompleteMurtiScene(ctx, width, height, img, idolData, isPlain, showBackdrop, customItems);
                } else {
                    this.drawLoadingAura(ctx, width, height);
                }
                finish();
                return;
            }

            // Image still loading in background
            this.drawLoadingAura(ctx, width, height);
            img.addEventListener('load', () => {
                clearTimeout(safetyTimer);
                ctx.save();
                this.drawCompleteMurtiScene(ctx, width, height, img, idolData, isPlain, showBackdrop, customItems);
                finish();
            }, { once: true });

            img.addEventListener('error', () => {
                clearTimeout(safetyTimer);
                finish();
            }, { once: true });
        });
    }

    drawCompleteMurtiScene(ctx, w, h, img, idolData, isPlain, showBackdrop, customItems) {
        const hasItems = customItems && customItems.length > 0;

        // 1. Background / Temple Darbar Stage
        if (showBackdrop || hasItems) {
            this.drawThemedBackdrop(ctx, w, h, idolData);
        } else {
            this.drawStudioStage(ctx, w, h);
        }

        // 2. High-Resolution Base Vigraham Image
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();

        // 3. Material Shader for Plain Base Murti (when not dressed)
        if (isPlain && !hasItems && idolData.material) {
            this.applyMaterialShader(ctx, w, h, idolData.material);
        }

        // 4. In Dress-Up Mode: Render Layered Costume Pieces (Barbie-doll dress-up style)
        if (isPlain && hasItems) {
            this.drawLayeredCostumes(ctx, w, h, customItems);
        }

        // 5. Divine Lighting & Golden Aura Atmosphere
        if (!isPlain || hasItems) {
            this.drawDivineAtmosphere(ctx, w, h, idolData);
        }

        // 6. Sacred Temple Frame
        if (showBackdrop || hasItems) {
            this.drawTempleFrame(ctx, w, h);
        }
    }

    drawStudioStage(ctx, w, h) {
        const grad = ctx.createRadialGradient(w / 2, h * 0.45, 60, w / 2, h / 2, w * 0.75);
        grad.addColorStop(0, '#2e1810');
        grad.addColorStop(0.65, '#160905');
        grad.addColorStop(1, '#080302');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const spot = ctx.createRadialGradient(w / 2, h * 0.85, 20, w / 2, h * 0.85, w * 0.45);
        spot.addColorStop(0, 'rgba(255, 215, 0, 0.12)');
        spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, w, h);
    }

    drawThemedBackdrop(ctx, w, h, idolData) {
        const theme = idolData.patternTheme || { bg: '#2b1206', accent: '#ffa502' };
        const grad = ctx.createRadialGradient(w / 2, h * 0.42, 60, w / 2, h / 2, w * 0.85);
        grad.addColorStop(0, theme.accent + '33');
        grad.addColorStop(0.5, theme.bg);
        grad.addColorStop(1, '#080302');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    applyMaterialShader(ctx, w, h, mat) {
        if (!mat || !mat.tint) return;
        ctx.save();
        ctx.globalCompositeOperation = 'color';
        ctx.fillStyle = mat.tint;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = mat.color;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    drawDivineAtmosphere(ctx, w, h, idolData) {
        const id = idolData.id || 1;
        ctx.save();

        const glow = ctx.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.35, w * 0.6);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.22)');
        glow.addColorStop(0.6, 'rgba(255, 120, 0, 0.10)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        const rand = (n) => {
            const x = Math.sin(id * 97 + n * 41) * 10000;
            return x - Math.floor(x);
        };

        // Holy starlight sparkles
        for (let i = 0; i < 10; i++) {
            const px = rand(i * 3 + 1) * w;
            const py = rand(i * 3 + 2) * h;
            const size = 1.5 + rand(i * 3 + 3) * 2.5;

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 235, 150, 0.75)';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.fill();
        }

        ctx.restore();
    }

    drawTempleFrame(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, w - 12, h - 12);

        ctx.strokeStyle = 'rgba(255, 235, 150, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, w - 20, h - 20);

        const corners = [
            [12, 12], [w - 12, 12], [12, h - 12], [w - 12, h - 12]
        ];
        corners.forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
        });

        ctx.restore();
    }

    drawLoadingAura(ctx, w, h) {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6);
        grad.addColorStop(0, '#4a2505');
        grad.addColorStop(1, '#110602');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'italic 16px "Cinzel", serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sacred Darshan Loading...', w / 2, h / 2);
    }

    // =========================================================================
    // BARBIE-STYLE ANATOMICAL DRESS-UP LAYER ENGINE
    // =========================================================================
    drawLayeredCostumes(ctx, w, h, items) {
        // Layer 1: Dhoti / Vastra (waist & legs)
        const vastra = items.find(i => i.type === 'vastra' || i.dhotiData);
        if (vastra) {
            this.drawAnatomicalDhoti(ctx, w, h, vastra);
        }

        // Layer 2: Mukut / Crown (head)
        const crown = items.find(i => i.type === 'crown');
        if (crown) {
            this.drawAnatomicalCrown(ctx, w, h, crown);
        }

        // Layer 3: Jewelry & Armlets (neck & arms)
        const jewelryList = items.filter(i => i.type === 'jewelry');
        jewelryList.forEach(j => this.drawAnatomicalJewelry(ctx, w, h, j));

        // Layer 4: Malas & Garlands (shoulders & chest)
        const garlands = items.filter(i => i.type === 'garland');
        garlands.forEach(g => this.drawAnatomicalGarland(ctx, w, h, g));

        // Layer 5: Tilak (forehead)
        const tilak = items.find(i => i.type === 'tilak');
        if (tilak) {
            this.drawAnatomicalTilak(ctx, w, h, tilak);
        }

        // Layer 6: Altar Offerings (Silver Thali, Diya, Mushak, Flower Shower)
        this.drawAltarOfferings(ctx, w, h, items);
    }

    /**
     * 1. Anatomical Dhoti / Vastra
     * Fitted precisely across Padmasana crossed knees (x=160..440, y=380..460) and waist (y=350..375)
     */
    drawAnatomicalDhoti(ctx, w, h, vastra) {
        ctx.save();

        let baseColor = '#e65100';
        let goldBorder = '#ffd700';
        let darkShade = '#8a2be2';

        if (vastra.id === 'v_crimson') {
            baseColor = '#800020';
            darkShade = '#4a0011';
        } else if (vastra.id === 'v_peacock') {
            baseColor = '#006699';
            darkShade = '#002b40';
        } else if (vastra.id === 'v_gold') {
            baseColor = '#e5a912';
            darkShade = '#805d07';
        } else if (vastra.id === 'v_white') {
            baseColor = '#f5f5f5';
            darkShade = '#b0bec5';
            goldBorder = '#c62828';
        } else if (vastra.id === 'v_sindoor') {
            baseColor = '#d84315';
            darkShade = '#7f1d00';
        }

        // Soft drop shadow beneath the garment
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        // --- Left Knee Silk Drape ---
        ctx.beginPath();
        ctx.moveTo(w * 0.45, h * 0.60);
        ctx.quadraticCurveTo(w * 0.32, h * 0.62, w * 0.27, h * 0.66);
        ctx.quadraticCurveTo(w * 0.24, h * 0.72, w * 0.34, h * 0.74);
        ctx.quadraticCurveTo(w * 0.45, h * 0.73, w * 0.48, h * 0.68);
        ctx.closePath();

        const lGrad = ctx.createLinearGradient(w * 0.25, h * 0.62, w * 0.45, h * 0.74);
        lGrad.addColorStop(0, baseColor);
        lGrad.addColorStop(0.6, baseColor);
        lGrad.addColorStop(1, darkShade);
        ctx.fillStyle = lGrad;
        ctx.fill();

        // Left Gold Zari Border
        ctx.strokeStyle = goldBorder;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // --- Right Knee Silk Drape ---
        ctx.beginPath();
        ctx.moveTo(w * 0.55, h * 0.60);
        ctx.quadraticCurveTo(w * 0.68, h * 0.62, w * 0.73, h * 0.66);
        ctx.quadraticCurveTo(w * 0.76, h * 0.72, w * 0.66, h * 0.74);
        ctx.quadraticCurveTo(w * 0.55, h * 0.73, w * 0.52, h * 0.68);
        ctx.closePath();

        const rGrad = ctx.createLinearGradient(w * 0.75, h * 0.62, w * 0.55, h * 0.74);
        rGrad.addColorStop(0, baseColor);
        rGrad.addColorStop(0.6, baseColor);
        rGrad.addColorStop(1, darkShade);
        ctx.fillStyle = rGrad;
        ctx.fill();

        // Right Gold Zari Border
        ctx.strokeStyle = goldBorder;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // --- Center Pleated Patka (Fan / Sash) ---
        ctx.beginPath();
        ctx.moveTo(w * 0.46, h * 0.60);
        ctx.lineTo(w * 0.54, h * 0.60);
        ctx.lineTo(w * 0.55, h * 0.76);
        ctx.lineTo(w * 0.45, h * 0.76);
        ctx.closePath();

        const pGrad = ctx.createLinearGradient(w * 0.46, h * 0.60, w * 0.54, h * 0.76);
        pGrad.addColorStop(0, '#ffd700');
        pGrad.addColorStop(0.3, baseColor);
        pGrad.addColorStop(0.7, baseColor);
        pGrad.addColorStop(1, '#ffd700');
        ctx.fillStyle = pGrad;
        ctx.fill();
        ctx.strokeStyle = goldBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fine pleated gold lines inside sash
        ctx.strokeStyle = 'rgba(255, 235, 150, 0.8)';
        ctx.lineWidth = 1;
        for (let x = w * 0.475; x <= w * 0.53; x += w * 0.018) {
            ctx.beginPath();
            ctx.moveTo(x, h * 0.60);
            ctx.lineTo(x, h * 0.75);
            ctx.stroke();
        }

        // --- Golden Kamarbandh (Jeweled Waistband) ---
        ctx.beginPath();
        ctx.ellipse(w * 0.50, h * 0.60, w * 0.11, h * 0.02, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#b8860b';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Central ruby gem on waistband
        ctx.beginPath();
        ctx.arc(w * 0.50, h * 0.60, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#d50000';
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();

        ctx.restore();
    }

    /**
     * 2. Anatomical Mukut / Crown
     * Fitted snugly on the head (center x=300, y=100..220)
     */
    drawAnatomicalCrown(ctx, w, h, crown) {
        ctx.save();

        const cx = w * 0.50;
        const cy = h * 0.28;

        // Divine Crown Aura / Sunburst Halo
        const haloGrad = ctx.createRadialGradient(cx, cy - h * 0.06, 10, cx, cy - h * 0.06, w * 0.28);
        haloGrad.addColorStop(0, 'rgba(255, 220, 100, 0.45)');
        haloGrad.addColorStop(0.6, 'rgba(255, 140, 0, 0.15)');
        haloGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - h * 0.06, w * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Crown Drop Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 5;

        if (crown.id === 'c_pheta') {
            // Kolhapuri Royal Pheta (Turban)
            ctx.beginPath();
            ctx.ellipse(cx, cy - 8, w * 0.14, h * 0.06, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6f00';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx - w * 0.10, cy);
            ctx.quadraticCurveTo(cx, cy - h * 0.08, cx + w * 0.10, cy);
            ctx.quadraticCurveTo(cx, cy - h * 0.14, cx - w * 0.10, cy);
            ctx.fillStyle = '#ff8f00';
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Pearl Kalgi crest
            ctx.beginPath();
            ctx.arc(cx - w * 0.05, cy - h * 0.10, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        } else if (crown.id === 'c_bal') {
            // Bal Ganesha Pink Lotus Crown
            for (let i = 0; i < 7; i++) {
                const angle = -Math.PI * 0.8 + (i * Math.PI * 0.26);
                const px = cx + Math.cos(angle) * w * 0.08;
                const py = (cy - h * 0.06) + Math.sin(angle) * h * 0.05;

                ctx.beginPath();
                ctx.ellipse(px, py, 11, 20, angle + Math.PI / 2, 0, Math.PI * 2);
                ctx.fillStyle = (i % 2 === 0) ? '#ff4081' : '#f48fb1';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        } else {
            // Royal 24K Gold Kalash Mukut (Lalbaug / Dagdusheth Gold Style)
            // Tier 1: Lower Headband
            ctx.beginPath();
            ctx.ellipse(cx, cy, w * 0.12, h * 0.024, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Tier 2: Mid Dome
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.11, cy - 2);
            ctx.quadraticCurveTo(cx - w * 0.08, cy - h * 0.09, cx, cy - h * 0.10);
            ctx.quadraticCurveTo(cx + w * 0.08, cy - h * 0.09, cx + w * 0.11, cy - 2);
            ctx.closePath();

            const cGrad = ctx.createLinearGradient(cx - w * 0.11, cy, cx + w * 0.11, cy - h * 0.10);
            cGrad.addColorStop(0, '#ffd700');
            cGrad.addColorStop(0.3, '#fff2a3');
            cGrad.addColorStop(0.7, '#e5a912');
            cGrad.addColorStop(1, '#996500');
            ctx.fillStyle = cGrad;
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Tier 3: Pinnacle Kalash & Diamond Flare
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.03, cy - h * 0.10);
            ctx.lineTo(cx, cy - h * 0.15);
            ctx.lineTo(cx + w * 0.03, cy - h * 0.10);
            ctx.closePath();
            ctx.fillStyle = '#fff8e1';
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.stroke();

            // Rubies & Emeralds Inlaid
            const gems = [
                { x: cx, y: cy - 2, c: '#d50000', r: 4 },
                { x: cx - w * 0.05, y: cy - 2, c: '#00c853', r: 3.5 },
                { x: cx + w * 0.05, y: cy - 2, c: '#00c853', r: 3.5 },
                { x: cx, y: cy - h * 0.05, c: '#d50000', r: 4.5 }
            ];
            gems.forEach(g => {
                ctx.beginPath();
                ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
                ctx.fillStyle = g.c;
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        ctx.restore();
    }

    /**
     * 3. Anatomical Jewelry & Armlets
     * Fitted across the chest (x=300, y=280..340) and arms
     */
    drawAnatomicalJewelry(ctx, w, h, jewel) {
        ctx.save();
        const cx = w * 0.50;

        if (jewel.variant === 'pearl_choker') {
            // Triple-strand pearl choker around neck
            for (let s = 0; s < 3; s++) {
                const cy = h * 0.44 + (s * 5);
                ctx.beginPath();
                ctx.ellipse(cx, cy, w * 0.07, h * 0.016, 0, 0, Math.PI);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3.5;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 4;
                ctx.stroke();
            }
            // Center emerald pendant
            ctx.beginPath();
            ctx.arc(cx, h * 0.46, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00e676';
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.stroke();
        } else {
            // 24K Navratna Kanthi Haar
            ctx.beginPath();
            ctx.ellipse(cx, h * 0.46, w * 0.085, h * 0.035, 0, 0, Math.PI);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#b8860b';
            ctx.shadowBlur = 6;
            ctx.stroke();

            // Navratna gemstone beads
            const gemColors = ['#d50000', '#ffffff', '#00c853', '#ffeb3b', '#29b6f6', '#ff9800', '#7e57c2'];
            for (let i = 0; i < gemColors.length; i++) {
                const angle = (i / (gemColors.length - 1)) * Math.PI;
                const gx = cx + Math.cos(angle) * (w * 0.085);
                const gy = h * 0.46 + Math.sin(angle) * (h * 0.035);

                ctx.beginPath();
                ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = gemColors[i];
                ctx.fill();
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    /**
     * 4. Anatomical Malas & Garlands
     * Loops gracefully over shoulders (x=210..390, y=260) down to lap (y=430)
     */
    drawAnatomicalGarland(ctx, w, h, garland) {
        ctx.save();
        const cx = w * 0.50;

        let petalColor1 = '#ff6d00';
        let petalColor2 = '#ffd600';

        if (garland.variant === 'hibiscus_red') {
            petalColor1 = '#d50000';
            petalColor2 = '#ff1744';
        } else if (garland.variant === 'durva_grass') {
            petalColor1 = '#2e7d32';
            petalColor2 = '#66bb6a';
        } else if (garland.variant === 'jasmine_white') {
            petalColor1 = '#ffffff';
            petalColor2 = '#e0f2f1';
        }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Draw individual botanical flower blossoms along the garland U-curve
        const count = 22;
        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const angle = Math.PI * 0.15 + t * (Math.PI * 0.70);
            const fx = cx + Math.cos(angle + Math.PI / 2) * (w * 0.16);
            const fy = h * 0.38 + Math.sin(angle) * (h * 0.18);

            ctx.beginPath();
            ctx.arc(fx, fy, 6.5, 0, Math.PI * 2);
            ctx.fillStyle = (i % 2 === 0) ? petalColor1 : petalColor2;
            ctx.fill();

            // Inner flower core dot
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fillStyle = (i % 2 === 0) ? '#ffeb3b' : '#d50000';
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 5. Anatomical Tilak
     * Placed centered on forehead (x=300, y=205)
     */
    drawAnatomicalTilak(ctx, w, h, tilak) {
        ctx.save();
        const cx = w * 0.50;
        const cy = h * 0.34;

        if (tilak.variant === 'chandrakala') {
            // Bhalachandra Moon Tilak
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0.2 * Math.PI, 0.8 * Math.PI, false);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy - 1, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#d50000';
            ctx.fill();
        } else if (tilak.variant === 'ashtagandha') {
            // Ashtagandha Bindi
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffab00';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#d50000';
            ctx.fill();
        } else {
            // Vedic Trishul Chandan & Kumkum
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.8;

            // 3 prongs of Trishul
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy - 6);
            ctx.quadraticCurveTo(cx - 5, cy, cx, cy + 3);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx + 5, cy - 6);
            ctx.quadraticCurveTo(cx + 5, cy, cx, cy + 3);
            ctx.stroke();

            // Red vertical kumkum center
            ctx.beginPath();
            ctx.moveTo(cx, cy - 7);
            ctx.lineTo(cx, cy + 4);
            ctx.strokeStyle = '#d50000';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * 6. Altar Offerings (Silver Modak Thali, Glowing Diya, Mushak, Flower Shower)
     */
    drawAltarOfferings(ctx, w, h, items) {
        const hasBhog = items.some(i => i.type === 'bhog' || i.variant === 'silver_modak' || i.variant === 'motichoor_laddoo');
        const hasDiya = items.some(i => i.variant === 'aarti_diya' || i.type === 'grand_sringar');
        const hasMushak = items.some(i => i.variant === 'golden_mushak' || i.type === 'grand_sringar');
        const hasFlowerShower = items.some(i => i.variant === 'flower_shower' || i.type === 'grand_sringar' || i.type === 'garland');

        // Silver Modak Thali (bottom-left)
        if (hasBhog || items.some(i => i.type === 'grand_sringar')) {
            ctx.save();
            ctx.translate(w * 0.22, h * 0.84);
            ctx.scale(1.1, 1.1);
            this.renderSilverModakThali(ctx);
            ctx.restore();
        }

        // Brass Akhand Aarti Diya (bottom-right)
        if (hasDiya) {
            ctx.save();
            ctx.translate(w * 0.78, h * 0.84);
            ctx.scale(1.1, 1.1);
            this.renderAkhandDiya(ctx);
            ctx.restore();
        }

        // Royal Golden Mushakraj
        if (hasMushak) {
            ctx.save();
            ctx.translate(w * 0.84, h * 0.78);
            ctx.scale(1.0, 1.0);
            this.renderGoldenMushak(ctx);
            ctx.restore();
        }

        // Flower Petal Shower
        if (hasFlowerShower) {
            ctx.save();
            const petals = [
                { x: w * 0.16, y: h * 0.18, r: 7, c: '#ff7800', rot: 0.4 },
                { x: w * 0.84, y: h * 0.22, r: 6, c: '#e60026', rot: -0.6 },
                { x: w * 0.12, y: h * 0.48, r: 8, c: '#ffea00', rot: 0.8 },
                { x: w * 0.88, y: h * 0.52, r: 7, c: '#ff7800', rot: -0.3 },
                { x: w * 0.24, y: h * 0.75, r: 9, c: '#e60026', rot: 1.1 },
                { x: w * 0.76, y: h * 0.76, r: 8, c: '#ffea00', rot: -0.9 },
                { x: w * 0.50, y: h * 0.12, r: 6, c: '#ff7800', rot: 0.2 }
            ];

            petals.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.beginPath();
                ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
                ctx.fillStyle = p.c;
                ctx.shadowColor = p.c;
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.restore();
            });
            ctx.restore();
        }
    }

    renderSilverModakThali(ctx) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;

        const rad = 32;
        const thaliGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, rad);
        thaliGrad.addColorStop(0, '#ffffff');
        thaliGrad.addColorStop(0.7, '#cfd8dc');
        thaliGrad.addColorStop(1, '#78909c');

        ctx.fillStyle = thaliGrad;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad, rad * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 5 Golden Modaks
        const modakPos = [[0, -3], [-9, 2], [9, 2], [-5, 6], [5, 6]];
        modakPos.forEach(([mx, my]) => {
            ctx.beginPath();
            ctx.moveTo(mx, my - 6);
            ctx.quadraticCurveTo(mx + 4.5, my + 2.5, mx, my + 4.5);
            ctx.quadraticCurveTo(mx - 4.5, my + 2.5, mx, my - 6);
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#b7791f';
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
        });
        ctx.restore();
    }

    renderAkhandDiya(ctx) {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.ellipse(0, 2, 16, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#8c6008';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        // Glowing holy flame
        const flameGrad = ctx.createRadialGradient(0, -9, 1, 0, -9, 13);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.35, '#fff59d');
        flameGrad.addColorStop(0.75, '#ff6d00');
        flameGrad.addColorStop(1, 'rgba(255,0,0,0)');

        ctx.beginPath();
        ctx.arc(0, -9, 13, 0, Math.PI * 2);
        ctx.fillStyle = flameGrad;
        ctx.fill();
        ctx.restore();
    }

    renderGoldenMushak(ctx) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#5a3d04';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(11, 0, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
    }
}

// Global renderer singleton
window.murtiRenderer = new MurtiRenderer();
