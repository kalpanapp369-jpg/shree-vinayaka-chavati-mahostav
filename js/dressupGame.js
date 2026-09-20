/**
 * Game 2: Murti Sringar & Dress-Up Game Engine
 * Manages 500 plain base idols across 12 distinct stone/clay/bronze sculptures,
 * authentic royal wardrobe catalog (Lalbaug & Dagdusheth Gold Mukuts, Silk Pitambars,
 * Temple Malas, Navratna Jewels, Chandan Tilak, Silver Modak Thali, Akhand Diya),
 * Aarti ceremony, and seamless transition to next idol or holy river Visarjan.
 */

class DressUpGame {
    constructor() {
        this.currentLevel = 1;
        this.idolData = null;
        this.canvas = null;
        this.ctx = null;

        this.equippedItems = []; // Array of equipped wardrobe items
        this.activeCategory = 'crowns';

        this.isAartiActive = false;
        this.aartiInterval = null;

        this.setupWardrobeCatalog();
    }

    init() {
        this.canvas = document.getElementById('dressup-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = 600;
            this.canvas.height = 600;
        }

        this.currentLevel = window.progressTracker.getDressUpCurrentLevel();
        this.setupWardrobeCatalog();
        this.bindEvents();
    }

    bindEvents() {
        // Wardrobe Category Tab Navigation
        const categoryTabs = document.querySelectorAll('.wardrobe-tab-btn');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeCategory = tab.dataset.category;
                this.renderWardrobeItems();
                if (window.sacredAudio) window.sacredAudio.playPieceSnap();
            });
        });

        // Top actions
        const clearAllBtn = document.getElementById('dressup-clear-btn');
        const aartiBtn = document.getElementById('dressup-aarti-btn');
        const finishBtn = document.getElementById('dressup-finish-btn');
        const downloadBtn = document.getElementById('dressup-download-btn');
        const quickRoyalBtn = document.getElementById('dressup-quick-royal-btn');

        if (clearAllBtn) clearAllBtn.onclick = () => this.clearAllEquipped();
        if (aartiBtn) aartiBtn.onclick = () => this.toggleAartiMode();
        if (finishBtn) finishBtn.onclick = () => this.finishDecoration();
        if (downloadBtn) downloadBtn.onclick = () => this.downloadMurtiCard();
        if (quickRoyalBtn) quickRoyalBtn.onclick = () => this.applyFullRoyalSringar();
    }

    loadLevel(levelNumber) {
        this.currentLevel = Math.max(1, Math.min(500, parseInt(levelNumber) || 1));
        window.progressTracker.setDressUpCurrentLevel(this.currentLevel);
        this.startLevel(this.currentLevel);
    }

    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.idolData = window.ganeshaCatalog.getIdol(this.currentLevel);
        this.equippedItems = [];
        this.isAartiActive = false;
        if (this.aartiInterval) clearInterval(this.aartiInterval);

        this.updateHeaderUI();
        this.renderWardrobeItems();
        this.renderIdol();
        this.updateSringarSummaryUI();
    }

    updateHeaderUI() {
        const titleEl = document.getElementById('dressup-level-title');
        const subEl = document.getElementById('dressup-level-subtitle');
        if (titleEl) titleEl.textContent = `Plain Idol ${this.currentLevel}/500: ${this.idolData.plainTitle || this.idolData.title}`;
        if (subEl) subEl.textContent = `Base Swaroop: ${this.idolData.archetypeName} • Material: ${this.idolData.material.name} (Ready for Sringar)`;
    }

    renderIdol() {
        if (!this.canvas || !this.idolData) return;

        // Render pure photorealistic idol on canvas with altar offerings
        window.murtiRenderer.renderToCanvas(this.canvas, this.idolData, {
            isPlain: true,
            showBackdrop: false,
            customItems: this.equippedItems
        });
    }

    setupWardrobeCatalog() {
        this.wardrobeCatalog = {
            crowns: [
                {
                    id: 'c_lalbaug',
                    type: 'crown',
                    name: 'Lalbaug 24K Surya Mukut',
                    desc: 'Towering pure gold crown with diamond kalash & sunburst radiance',
                    targetImage: 'assets/images/lalbaug.jpg',
                    icon: '👑'
                },
                {
                    id: 'c_dagdusheth',
                    type: 'crown',
                    name: 'Shrimant Dagdusheth Gold Mukut',
                    desc: 'World-famous 24K pure gold crown with embossed temple motifs',
                    targetImage: 'assets/images/dagdusheth.jpg',
                    icon: '👑'
                },
                {
                    id: 'c_bal',
                    type: 'crown',
                    name: 'Bal Ganesha Lotus Mukut',
                    desc: 'Sacred blooming pink lotus crest with pearls',
                    targetImage: 'assets/images/bal_ganesh.jpg',
                    icon: '🪷'
                },
                {
                    id: 'c_marble',
                    type: 'crown',
                    name: 'Makrana Diamond Kiritam',
                    desc: 'Pristine Makrana white marble temple crown with glowing diamonds',
                    targetImage: 'assets/images/marble.jpg',
                    icon: '💎'
                },
                {
                    id: 'c_siddhi',
                    type: 'crown',
                    name: 'Siddhivinayak Saffron Mukut',
                    desc: 'Radiant saffron sindoor mukut within silver mandir sanctum',
                    targetImage: 'assets/images/siddhivinayak.jpg',
                    icon: '🪔'
                },
                {
                    id: 'c_mayur',
                    type: 'crown',
                    name: 'Lord Mayureshwar Peacock Crest',
                    desc: 'Ashtavinayak celestial peacock crown with emerald gems',
                    targetImage: 'assets/images/mayureshwar.jpg',
                    icon: '🦚'
                },
                {
                    id: 'c_nritya',
                    type: 'crown',
                    name: 'Nritya Flaming Prabhavali Crown',
                    desc: 'Cosmic Anandatandava ring of sacred temple flames',
                    targetImage: 'assets/images/nritya.jpg',
                    icon: '🔥'
                },
                {
                    id: 'c_tanjore',
                    type: 'crown',
                    name: 'Tanjore 22K Gold Embossed Mukut',
                    desc: 'Historic Thanjavur 22K gold foil embossed crown with rubies',
                    targetImage: 'assets/images/tanjore.jpg',
                    icon: '👑'
                },
                {
                    id: 'c_panchamukhi',
                    type: 'crown',
                    name: 'Panchamukhi 5-Faced Celestial Crown',
                    desc: 'Five-headed divine crown with celestial astras',
                    targetImage: 'assets/images/panchamukhi.jpg',
                    icon: '👑'
                },
                {
                    id: 'c_bronze',
                    type: 'crown',
                    name: 'Antique Chola Bronze Crown',
                    desc: 'Historic ancient Chola temple bronze cast crown',
                    targetImage: 'assets/images/chola_bronze.jpg',
                    icon: '🏛️'
                },
                {
                    id: 'c_sphatik',
                    type: 'crown',
                    name: 'Sphatik Quartz Crystal Kiritam',
                    desc: 'Pure celestial crystal crown with silver halo',
                    targetImage: 'assets/images/sphatik.jpg',
                    icon: '✨'
                }
            ],
            vastra: [
                {
                    id: 'v_saffron',
                    type: 'vastra',
                    name: 'Sacred Saffron Pitambar',
                    desc: 'Pure Varanasi saffron silk with gold zari border',
                    targetImage: 'assets/images/lalbaug.jpg',
                    icon: '👘'
                },
                {
                    id: 'v_crimson',
                    type: 'vastra',
                    name: 'Royal Crimson Velvet Kashta',
                    desc: 'Grand maroon-red velvet dhoti with gold embroidery',
                    targetImage: 'assets/images/dagdusheth.jpg',
                    icon: '👘'
                },
                {
                    id: 'v_peacock',
                    type: 'vastra',
                    name: 'Peacock Feather Blue Silk',
                    desc: 'Celestial peacock blue silk with gold brocade',
                    targetImage: 'assets/images/mayureshwar.jpg',
                    icon: '👘'
                },
                {
                    id: 'v_gold',
                    type: 'vastra',
                    name: '24K Golden Zari Weave',
                    desc: 'Shimmering royal gold metallic weave',
                    targetImage: 'assets/images/tanjore.jpg',
                    icon: '👘'
                },
                {
                    id: 'v_white',
                    type: 'vastra',
                    name: 'Kashi White Temple Silk',
                    desc: 'Pristine white silk dhoti with red ganga-jamuna border',
                    targetImage: 'assets/images/marble.jpg',
                    icon: '👘'
                },
                {
                    id: 'v_sindoor',
                    type: 'vastra',
                    name: 'Vedic Sindoor Ochre Dhoti',
                    desc: 'Sacred ochre silk with holy temple blessings',
                    targetImage: 'assets/images/siddhivinayak.jpg',
                    icon: '👘'
                }
            ],
            garlands: [
                {
                    id: 'g_marigold',
                    type: 'garland',
                    variant: 'marigold_orange',
                    name: 'Orange Marigold (Genda) Haar',
                    desc: 'Thick fresh orange temple marigold garland cascading gracefully',
                    icon: '🌼'
                },
                {
                    id: 'g_hibiscus',
                    type: 'garland',
                    variant: 'hibiscus_red',
                    name: 'Red Hibiscus (Jaswand) Mala',
                    desc: 'Lord Ganesha beloved sacred red hibiscus flower mala',
                    icon: '🌺'
                },
                {
                    id: 'g_durva',
                    type: 'garland',
                    variant: 'durva_grass',
                    name: 'Sacred 21-Patra Durva Grass Haar',
                    desc: 'Fresh green 21-blade Durva grass auspicious garland',
                    icon: '🌿'
                },
                {
                    id: 'g_jasmine',
                    type: 'garland',
                    variant: 'jasmine_white',
                    name: 'Fragrant White Jasmine Mogra Mala',
                    desc: 'Pure white sweet-scented mogra flower mala',
                    icon: '🌸'
                }
            ],
            jewelry: [
                {
                    id: 'j_kanthi',
                    type: 'jewelry',
                    variant: 'kanthi_haar',
                    name: '24K Navratna Kanthi Haar',
                    desc: 'Nine celestial gemstones set in pure 24K temple gold',
                    icon: '💎'
                },
                {
                    id: 'j_pearl',
                    type: 'jewelry',
                    variant: 'pearl_choker',
                    name: 'Royal Pearl Choker & Kundan',
                    desc: 'Triple-strand natural pearls with emerald pendant',
                    icon: '📿'
                },
                {
                    id: 'j_baju',
                    type: 'jewelry',
                    variant: 'gold_bajuband',
                    name: 'Royal Gold Bajuband Armlets',
                    desc: 'Heavy embossed gold armlets for all four hands',
                    icon: '👑'
                }
            ],
            tilak: [
                {
                    id: 't_trishul',
                    type: 'tilak',
                    variant: 'trishul',
                    name: 'Vedic Trishul Chandan & Kumkum',
                    desc: 'Pure sandalwood trident tilak with vermilion center',
                    icon: '🔱'
                },
                {
                    id: 't_chandra',
                    type: 'tilak',
                    variant: 'chandrakala',
                    name: 'Bhalachandra Crescent Moon',
                    desc: 'Auspicious crescent moon with red sindoor bindu',
                    icon: '🌙'
                },
                {
                    id: 't_bindi',
                    type: 'tilak',
                    variant: 'ashtagandha',
                    name: 'Kasturi Ashtagandha Bindi',
                    desc: 'Eight sacred herbs fragrant yellow-orange holy mark',
                    icon: '✨'
                }
            ],
            bhog: [
                {
                    id: 'b_modak',
                    type: 'bhog',
                    variant: 'silver_modak',
                    name: 'Silver Modak Prasad Thali (21 Modaks)',
                    desc: 'Polished silver platter with 21 golden steamed modaks on altar',
                    icon: '🥟'
                },
                {
                    id: 'b_laddoo',
                    type: 'bhog',
                    variant: 'motichoor_laddoo',
                    name: 'Motichoor Laddoo Sweet Platter',
                    desc: 'Pure ghee saffron motichoor laddoos with pistachios',
                    icon: '🥮'
                }
            ],
            decor: [
                {
                    id: 'd_diya',
                    type: 'decor',
                    variant: 'aarti_diya',
                    name: 'Brass Akhand Aarti Diya',
                    desc: 'Glowing brass oil lamp on altar with flickering holy flame',
                    icon: '🪔'
                },
                {
                    id: 'd_mushak',
                    type: 'decor',
                    variant: 'golden_mushak',
                    name: 'Royal Golden Mushakraj',
                    desc: 'Lord Ganesha faithful golden mouse vahana offering modak',
                    icon: '🐁'
                },
                {
                    id: 'd_flower_shower',
                    type: 'decor',
                    variant: 'flower_shower',
                    name: 'Pushpa Vrishti (Flower Petal Shower)',
                    desc: 'Continuous celestial shower of fresh marigold & rose petals',
                    icon: '🌸'
                }
            ]
        };
    }

    renderWardrobeItems() {
        if (!this.wardrobeCatalog) this.setupWardrobeCatalog();
        const grid = document.getElementById('wardrobe-items-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const items = (this.wardrobeCatalog && this.wardrobeCatalog[this.activeCategory]) || [];

        items.forEach(item => {
            const isEquipped = this.equippedItems.some(i => i.id === item.id || (i.type === item.type && i.targetImage === item.targetImage));
            const card = document.createElement('div');
            card.className = `wardrobe-item-card ${isEquipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <div class="item-icon-badge">${item.icon || '✨'}</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
                <div class="item-status-pill">${isEquipped ? '✓ Adorned' : '+ Equip'}</div>
            `;

            card.onclick = () => this.toggleEquipItem(item);
            grid.appendChild(card);
        });
    }

    toggleEquipItem(itemDef) {
        const existingIdx = this.equippedItems.findIndex(i => i.id === itemDef.id || i.type === itemDef.type);

        if (existingIdx !== -1 && this.equippedItems[existingIdx].id === itemDef.id) {
            // Already equipped -> toggle off
            this.equippedItems.splice(existingIdx, 1);
        } else if (existingIdx !== -1) {
            // Replace existing item of same slot
            this.equippedItems[existingIdx] = { ...itemDef };
        } else {
            // Equip new item
            this.equippedItems.push({ ...itemDef });
        }

        if (window.sacredAudio) {
            window.sacredAudio.playPieceSnap();
            window.sacredAudio.playTempleBell(880, 0.6);
        }

        this.renderIdol();
        this.renderWardrobeItems();
        this.updateSringarSummaryUI();
    }

    applyFullRoyalSringar() {
        // Equip Grand Royal Sringar matching this level's archetype
        const targetImg = this.idolData.imageSrc || 'assets/images/lalbaug.jpg';
        this.equippedItems = [
            {
                id: 'grand_royal_' + this.idolData.id,
                type: 'grand_sringar',
                name: `Grand Royal ${this.idolData.archetypeName} Sringar`,
                targetImage: targetImg,
                variant: 'grand_sringar',
                icon: '👑'
            },
            {
                id: 'b_modak',
                type: 'bhog',
                variant: 'silver_modak',
                name: 'Silver Modak Prasad Thali',
                icon: '🥟'
            },
            {
                id: 'd_diya',
                type: 'decor',
                variant: 'aarti_diya',
                name: 'Brass Akhand Aarti Diya',
                icon: '🪔'
            },
            {
                id: 'd_mushak',
                type: 'decor',
                variant: 'golden_mushak',
                name: 'Royal Golden Mushakraj',
                icon: '🐁'
            },
            {
                id: 'd_flower_shower',
                type: 'decor',
                variant: 'flower_shower',
                name: 'Pushpa Vrishti (Flower Petal Shower)',
                icon: '🌸'
            }
        ];

        if (window.sacredAudio) {
            window.sacredAudio.playSuccessFanfare();
            window.sacredAudio.playTempleBell(1046, 1.2);
        }

        this.renderIdol();
        this.renderWardrobeItems();
        this.updateSringarSummaryUI();
    }

    clearAllEquipped() {
        this.equippedItems = [];
        if (window.sacredAudio) window.sacredAudio.playPieceSnap();
        this.renderIdol();
        this.renderWardrobeItems();
        this.updateSringarSummaryUI();
    }

    updateSringarSummaryUI() {
        const summaryEl = document.getElementById('sringar-equipped-summary');
        if (!summaryEl) return;

        if (this.equippedItems.length === 0) {
            summaryEl.innerHTML = `<span class="sringar-empty-text">✨ Plain unadorned sculpture. Select items above to start Sringar!</span>`;
            return;
        }

        const tags = this.equippedItems.map(item => `
            <span class="equipped-tag">
                ${item.icon || '✨'} ${item.name.split(' ')[0]} ${item.name.split(' ')[1] || ''}
            </span>
        `).join('');

        summaryEl.innerHTML = `<span class="summary-label">Adornments:</span> ${tags}`;
    }

    // --- Aarti Ceremony Mode ---
    toggleAartiMode() {
        this.isAartiActive = !this.isAartiActive;
        const aartiOverlay = document.getElementById('aarti-flame-overlay');
        const aartiBtn = document.getElementById('dressup-aarti-btn');

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

    // --- Finish Sringar & Modal ---
    finishDecoration() {
        if (this.isAartiActive) this.toggleAartiMode();

        window.progressTracker.recordDressUpCompletion(
            this.currentLevel,
            this.equippedItems.length,
            this.equippedItems
        );

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

        if (titleEl) titleEl.textContent = `Murti Sringar Completed! (Level ${this.currentLevel}/500)`;
        if (statsEl) statsEl.innerHTML = `✨ Adornments Placed: <b>${this.equippedItems.length || 'Grand Royal'} sacred items</b> on ${this.idolData.material.name} murti!`;
        if (blessingEl) blessingEl.textContent = `"${this.idolData.blessing}"`;

        modal.classList.add('active');

        // Modal Action: "Only Dress-Up (Next Idol)"
        const nextBtn = document.getElementById('dcm-next-dressup-btn');
        if (nextBtn) {
            nextBtn.onclick = () => {
                modal.classList.remove('active');
                if (this.currentLevel < 500) {
                    this.loadLevel(this.currentLevel + 1);
                } else {
                    alert("Grand Blessings! You have decorated all 500 plain Ganesha idols!");
                }
            };
        }

        // Modal Action: "Dress-Up + Nimarjanam"
        const visarjanBtn = document.getElementById('dcm-visarjan-btn');
        if (visarjanBtn) {
            visarjanBtn.onclick = () => {
                modal.classList.remove('active');
                window.mainApp.switchMode('nimarjanam', {
                    idolData: this.idolData,
                    customItems: this.equippedItems,
                    fromMode: 'dressup',
                    nextLevel: this.currentLevel < 500 ? this.currentLevel + 1 : 1
                });
            };
        }
    }

    downloadMurtiCard() {
        if (!this.canvas) return;
        const link = document.createElement('a');
        link.download = `Ganesh_Chaturthi_Murti_Swaroop_${this.currentLevel}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        if (window.sacredAudio) window.sacredAudio.playTempleBell(1046, 1.5);
    }
}

// Global dress-up game instance
window.dressupGame = new DressUpGame();
