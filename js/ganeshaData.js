/**
 * Ganesha 500 Divine Murtis Data & Procedural Catalog
 * Features 12 Photorealistic Vigraham Archetypes with real temple darshan photos,
 * rich sacred auras, slokas, distinct base idols for dress-up, and unique variations across all 500 levels.
 */

const VIGRAHAM_ARCHETYPES = [
    {
        id: 'lalbaug_raja',
        name: 'Lalbaugcha Raja Royal Swaroop',
        imageSrc: 'assets/images/lalbaug.jpg',
        coloringImageSrc: 'assets/images/coloring_lalbaug.jpg',
        plainImageSrc: 'assets/images/terracotta.jpg',
        plainType: 'terracotta_clay',
        category: 'Darbar Raja',
        description: 'Iconic towering Mumbai king on royal golden sinhasan with cascading floral malas and diamond crown.'
    },
    {
        id: 'dagdusheth_royal',
        name: 'Shrimant Dagdusheth Halwai Ganapati',
        imageSrc: 'assets/images/dagdusheth.jpg',
        coloringImageSrc: 'assets/images/coloring_dagdusheth.jpg',
        plainImageSrc: 'assets/images/plain_marble.jpg',
        plainType: 'white_marble',
        category: 'Golden Sanctum',
        description: 'World-famous Pune deity adorned with pure 24K gold mukut, kanthi haar, and radiant sanctum deepams.'
    },
    {
        id: 'bal_ganesha',
        name: 'Cute Bal Ganesha on Lotus',
        imageSrc: 'assets/images/bal_ganesh.jpg',
        coloringImageSrc: 'assets/images/coloring_bal_ganesh.jpg',
        plainImageSrc: 'assets/images/terracotta.jpg',
        plainType: 'bal_ganesh_clay',
        category: 'Child Avatar',
        description: 'Adorable innocent Bal Ganesha seated upon a blooming pink lotus holding a golden modak with baby Mushak.'
    },
    {
        id: 'marble_temple',
        name: 'Makrana Pure White Marble Vigraham',
        imageSrc: 'assets/images/marble.jpg',
        coloringImageSrc: 'assets/images/coloring_marble.jpg',
        plainImageSrc: 'assets/images/plain_marble.jpg',
        plainType: 'white_marble',
        category: 'Marble Sanctum',
        description: 'Pristine Makrana white marble deity carved by temple master sculptors, decorated with fresh fragrant marigolds.'
    },
    {
        id: 'siddhivinayak_temple',
        name: 'Shree Siddhivinayak Saffron Darbar',
        imageSrc: 'assets/images/siddhivinayak.jpg',
        coloringImageSrc: 'assets/images/coloring_siddhivinayak.jpg',
        plainImageSrc: 'assets/images/terracotta.jpg',
        plainType: 'sindoor_clay',
        category: 'Navasacha Ganapati',
        description: 'Sacred right-turned trunk (Dakshinabhimukhi) sindoor deity within an ornate carved silver mandir sanctum.'
    },
    {
        id: 'eco_terracotta',
        name: 'Artisan Eco Shadu Terracotta Murti',
        imageSrc: 'assets/images/terracotta.jpg',
        coloringImageSrc: 'assets/images/coloring_terracotta.jpg',
        plainImageSrc: 'assets/images/terracotta.jpg',
        plainType: 'terracotta_clay',
        category: 'Eco Artisan',
        description: 'Handcrafted natural clay idol sculpted by hereditary master artisans in traditional earthen texture.'
    },
    {
        id: 'panchamukhi_heramba',
        name: 'Panchamukhi Heramba (5-Faced King)',
        imageSrc: 'assets/images/panchamukhi.jpg',
        coloringImageSrc: 'assets/images/coloring_panchamukhi.jpg',
        plainImageSrc: 'assets/images/plain_marble.jpg',
        plainType: 'panchamukhi_stone',
        category: 'Tantric Vigraham',
        description: 'Five majestic elephant heads with ten arms holding celestial astras, seated upon a roaring golden lion.'
    },
    {
        id: 'mayureshwara_peacock',
        name: 'Lord Mayureshwara on Peacock',
        imageSrc: 'assets/images/mayureshwar.jpg',
        coloringImageSrc: 'assets/images/coloring_mayureshwar.jpg',
        plainImageSrc: 'assets/images/terracotta.jpg',
        plainType: 'mayureshwar_clay',
        category: 'Ashtavinayak',
        description: 'First of the Ashtavinayak deities riding a magnificent celestial peacock with luminous emerald feathers.'
    },
    {
        id: 'nritya_ganapati',
        name: 'Sacred Nritya Dancing Vinayaka',
        imageSrc: 'assets/images/nritya.jpg',
        coloringImageSrc: 'assets/images/coloring_nritya.jpg',
        plainImageSrc: 'assets/images/plain_marble.jpg',
        plainType: 'nritya_marble',
        category: 'Cosmic Dance',
        description: 'Cosmic Anandatandava dance within an illuminating ring of sacred temple flames (Prabhavali).'
    },
    {
        id: 'tanjore_gold',
        name: '22K Gold Embossed Tanjore Painting',
        imageSrc: 'assets/images/tanjore.jpg',
        coloringImageSrc: 'assets/images/coloring_tanjore.jpg',
        plainImageSrc: 'assets/images/terracotta.jpg',
        plainType: 'sandalwood_wood',
        category: 'Heritage Art',
        description: 'Traditional Thanjavur temple masterpiece embossed with authentic 22-karat gold foil relief and rubies.'
    },
    {
        id: 'chola_bronze',
        name: 'Antique Chola Dynasty Bronze Idol',
        imageSrc: 'assets/images/chola_bronze.jpg',
        coloringImageSrc: 'assets/images/coloring_chola_bronze.jpg',
        plainImageSrc: 'assets/images/chola_bronze.jpg',
        plainType: 'antique_bronze',
        category: 'Antique Bronze',
        description: 'Historic Chola bronze murti from ancient temple sanctum with antique patina and authentic casting.'
    },
    {
        id: 'sphatik_crystal',
        name: 'Celestial Sphatik Quartz Crystal Idol',
        imageSrc: 'assets/images/sphatik.jpg',
        coloringImageSrc: 'assets/images/coloring_sphatik.jpg',
        plainImageSrc: 'assets/images/sphatik.jpg',
        plainType: 'crystal_sphatik',
        category: 'Spiritual Crystal',
        description: 'Luminous translucent Sphatik crystal deity radiating divine celestial light, seated on a silver lotus.'
    }
];

const BASE_MATERIALS = [
    { id: 'shadu_clay', name: 'Eco Shadu Clay', color: '#c29b7f', tint: 'rgba(194, 155, 127, 0.25)', type: 'clay' },
    { id: 'white_marble', name: 'Makrana Pure White Marble', color: '#eaeef2', tint: 'rgba(255, 255, 255, 0.2)', type: 'marble' },
    { id: 'sandalwood', name: 'Fragrant Sandalwood (Chandan)', color: '#d9ab6a', tint: 'rgba(217, 171, 106, 0.3)', type: 'wood' },
    { id: 'terracotta', name: 'Vedic Terracotta Red', color: '#b85435', tint: 'rgba(184, 84, 53, 0.3)', type: 'terracotta' },
    { id: 'black_granite', name: 'Shiva Linga Black Granite', color: '#3a3a42', tint: 'rgba(30, 30, 36, 0.45)', type: 'stone' },
    { id: 'temple_brass', name: 'Sanctum Golden Brass', color: '#dca424', tint: 'rgba(220, 164, 36, 0.3)', type: 'metal' },
    { id: 'red_sindoor', name: 'Sacred Red Sindoor Ochre', color: '#e64024', tint: 'rgba(230, 64, 36, 0.35)', type: 'sindoor' },
    { id: 'emerald_jade', name: 'Marakata Green Jade Stone', color: '#2d6d54', tint: 'rgba(45, 109, 84, 0.35)', type: 'gem' },
    { id: 'royal_gold', name: 'Ashtadhatu 24K Royal Gold', color: '#e5b829', tint: 'rgba(229, 184, 41, 0.35)', type: 'gold' }
];

const PATTERN_THEMES = [
    { id: 'royal_velvet', name: 'Royal Velvet Darbar with Gold Zari', bg: '#4a0711', accent: '#ffd700' },
    { id: 'cosmic_celestial', name: 'Cosmic Celestial Starlight & Nebula', bg: '#0f1035', accent: '#70a1ff' },
    { id: 'temple_sanctum', name: 'Golden Sanctum with Temple Deepams', bg: '#2b1206', accent: '#ffa502' },
    { id: 'river_ghat', name: 'Ganga Ghat with Floating Diyas', bg: '#0a2336', accent: '#2ed573' },
    { id: 'peacock_mandala', name: 'Peacock Feather Floral Mandala', bg: '#06261f', accent: '#1dd1a1' },
    { id: 'sacred_fire', name: 'Holy Yajna Havankund Fire Glow', bg: '#3a1102', accent: '#ff4757' },
    { id: 'banyan_grove', name: 'Banyan Tree Grove with Lotus Pond', bg: '#1c2809', accent: '#7bed9f' },
    { id: 'zodiac_mandala', name: 'Surya Mandala with Ashtavinayak Shrines', bg: '#2d0938', accent: '#e056fd' }
];

const DHOTI_PATTERNS = [
    { name: 'Sacred Saffron Pitambar with Gold Border', hex: '#ff7700', border: '#ffd700' },
    { name: 'Royal Crimson Velvet Kashta', hex: '#8b0000', border: '#ffb700' },
    { name: 'Peacock Feather Silk', hex: '#0a6496', border: '#ffe066' },
    { name: '24K Golden Zari Weave', hex: '#e8aa14', border: '#ffffff' },
    { name: 'Emerald Green Silk Pitambar', hex: '#166d3b', border: '#ffd700' },
    { name: 'Pristine White Temple Silk', hex: '#f0f4f8', border: '#e63946' },
    { name: 'Vedic Ochre & Maroon Border', hex: '#c0392b', border: '#f39c12' }
];

window.DHOTI_COLORS = DHOTI_PATTERNS;
window.DHOTI_PATTERNS = DHOTI_PATTERNS;
window.VIGRAHAM_ARCHETYPES = VIGRAHAM_ARCHETYPES;
window.BASE_MATERIALS = BASE_MATERIALS;
window.PATTERN_THEMES = PATTERN_THEMES;

const SACRED_TELUGU_QUOTES = [
    "Lord Ganesha illuminates the path of victory, peace, and eternal happiness.",
    "By the divine grace of Shree Ganapati, all obstacles vanish and harmony prevails.",
    "Om Gam Ganapataye Namaha - Lord of wisdom who fulfills every noble wish.",
    "Humble prostrations to Gananatha, who bestows supreme intellect, wealth, and virtue.",
    "Surrendering to the lotus feet of Prathama Pujya Ganesha brings auspicious blessings.",
    "May Modaka-loving Lord Ganesha sweeten your journey with boundless delight!",
    "Through the grace of Vighnaharta, may all your righteous endeavors succeed!"
];

const SACRED_BLESSINGS = [
    "Vakratunda Mahakaya Suryakoti Samaprabha, Nirvighnam Kuru Me Deva Sarvakaryeshu Sarvada.",
    "May Lord Ganesha remove all obstacles and shower your home with boundless prosperity!",
    "गणपति बाप्पा मोरया, मंगल मूर्ति मोरया! सुखकर्ता दुखहर्ता विघ्नविनाशक मोरया!",
    "May the elephant god grant you wisdom, good health, peace, and eternal joy!",
    "ॐ गं गणपतये नमः - May divine knowledge and auspicious beginnings be yours!",
    "Pratham Pujya Shree Ganesha blesses you with success in every endeavor!",
    "May the sweetness of Modak fill your life with eternal happiness and contentment!",
    "May Lord Vighnaharta protect you and guide your path towards supreme enlightenment!"
];

class GaneshaCatalog {
    constructor() {
        this.cache = new Map();
        this.totalIdols = 500;
    }

    /**
     * Deterministically generates unique idol metadata for any level (1 to 500)
     */
    getIdol(level) {
        const id = Math.max(1, Math.min(this.totalIdols, parseInt(level) || 1));
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        // Deterministic pseudo-random seed
        const seed = id * 2879 + 5431;
        const rand = (offset) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        // Select 1 of 12 distinct realistic Vigraham Archetypes
        const archetypeIndex = (id - 1) % VIGRAHAM_ARCHETYPES.length;
        const archetype = VIGRAHAM_ARCHETYPES[archetypeIndex];
        const cycleCount = Math.floor((id - 1) / VIGRAHAM_ARCHETYPES.length) + 1;
        
        // Select distinct base material shader for plain idol dressup
        const materialIndex = (id - 1 + Math.floor((id - 1) / 12)) % BASE_MATERIALS.length;
        const material = BASE_MATERIALS[materialIndex];

        // Specific plain base image selection: alternate between raw clay, pure marble, bronze, crystal
        let plainImageSrc = archetype.plainImageSrc;
        if (material.id === 'white_marble' || material.id === 'emerald_jade') {
            plainImageSrc = 'assets/images/plain_marble.jpg';
        } else if (material.id === 'black_granite' || material.id === 'temple_brass') {
            plainImageSrc = 'assets/images/chola_bronze.jpg';
        } else {
            plainImageSrc = 'assets/images/terracotta.jpg';
        }

        const title = cycleCount > 1 ? `${archetype.name} • Darshan #${id}` : archetype.name;
        const plainTitle = `Plain ${material.name} Murti (#${id})`;

        const patternTheme = PATTERN_THEMES[Math.floor(rand(2) * PATTERN_THEMES.length)];
        const dhoti = DHOTI_PATTERNS[Math.floor(rand(3) * DHOTI_PATTERNS.length)];
        const blessing = SACRED_BLESSINGS[(id - 1) % SACRED_BLESSINGS.length];
        const teluguQuote = SACRED_TELUGU_QUOTES[(id - 1) % SACRED_TELUGU_QUOTES.length];

        const tilak = (id % 4 === 0) ? 'trishul' : (id % 4 === 1) ? 'chandrakala' : (id % 4 === 2) ? 'ashtagandha' : 'urdhva';
        const garland = (id % 4 === 0) ? 'marigold_orange' : (id % 4 === 1) ? 'hibiscus_red' : (id % 4 === 2) ? 'durva_grass' : 'jasmine_white';

        const idolData = {
            id,
            title,
            plainTitle,
            archetype: archetype.id,
            archetypeName: archetype.name,
            imageSrc: archetype.imageSrc,
            coloringImageSrc: archetype.coloringImageSrc,
            plainImageSrc: plainImageSrc,
            category: archetype.category,
            description: archetype.description,
            material,
            patternTheme,
            dhoti,
            tilak,
            garland,
            blessing,
            teluguQuote,
            hasMushak: true,
            complexity: id <= 50 ? 'Novice' : id <= 200 ? 'Intermediate' : id <= 350 ? 'Advanced' : 'Grand Master',
            gridSize: id <= 30 ? 3 : id <= 150 ? 3 : id <= 350 ? 4 : 4
        };

        this.cache.set(id, idolData);
        return idolData;
    }

    getAllSummaries() {
        const list = [];
        for (let i = 1; i <= this.totalIdols; i++) {
            list.push(this.getIdol(i));
        }
        return list;
    }
}

// Global catalog singleton
window.ganeshaCatalog = new GaneshaCatalog();
