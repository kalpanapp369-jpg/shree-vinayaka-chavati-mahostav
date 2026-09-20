/**
 * Progress & State Management System
 * Manages player progress across all 500 levels in Puzzle, Dress-Up, and Nimarjanam modes
 */

class ProgressTracker {
    constructor() {
        this.STORAGE_KEY = 'ganesh_chaturthi_game_v1';
        this.data = this.loadData();
    }

    getDefaultData() {
        return {
            puzzle: {
                currentLevel: 1,
                completedLevels: {}, // { levelId: { stars: 3, time: 45, moves: 12, date: '...' } }
                totalScore: 0
            },
            dressup: {
                currentLevel: 1,
                decoratedLevels: {}, // { levelId: { itemsCount: 5, date: '...' } }
                savedMurtis: {}
            },
            nimarjanam: {
                currentLevel: 1,
                immersedLevels: {}, // { levelId: { date: '...' } }
                totalImmersions: 0
            },
            achievements: [],
            soundEnabled: true,
            bgMusicEnabled: false
        };
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...this.getDefaultData(), ...parsed };
            }
        } catch (e) {
            console.warn("Could not load from localStorage, using defaults", e);
        }
        return this.getDefaultData();
    }

    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn("Could not save to localStorage", e);
        }
    }

    // --- Puzzle Progress ---
    getPuzzleCurrentLevel() {
        return this.data.puzzle.currentLevel || 1;
    }

    setPuzzleCurrentLevel(lvl) {
        this.data.puzzle.currentLevel = Math.max(1, Math.min(500, parseInt(lvl) || 1));
        this.saveData();
    }

    recordPuzzleCompletion(levelId, timeSeconds, moves, stars) {
        levelId = parseInt(levelId);
        const prev = this.data.puzzle.completedLevels[levelId];
        const isBetter = !prev || stars > prev.stars || (stars === prev.stars && timeSeconds < prev.time);

        if (isBetter) {
            this.data.puzzle.completedLevels[levelId] = {
                stars: Math.max(1, Math.min(3, stars)),
                time: timeSeconds,
                moves: moves,
                date: new Date().toISOString()
            };
        }

        const scoreEarned = stars * 1000 + Math.max(0, 300 - timeSeconds * 2) + Math.max(0, 100 - moves * 2);
        this.data.puzzle.totalScore = (this.data.puzzle.totalScore || 0) + scoreEarned;

        // Auto unlock next level
        if (levelId >= this.data.puzzle.currentLevel && levelId < 500) {
            this.data.puzzle.currentLevel = levelId + 1;
        }

        this.checkAchievements();
        this.saveData();
        return scoreEarned;
    }

    isPuzzleCompleted(levelId) {
        return !!this.data.puzzle.completedLevels[parseInt(levelId)];
    }

    getPuzzleLevelStats(levelId) {
        return this.data.puzzle.completedLevels[parseInt(levelId)] || null;
    }

    // --- Dress-Up Progress ---
    getDressUpCurrentLevel() {
        return this.data.dressup.currentLevel || 1;
    }

    setDressUpCurrentLevel(lvl) {
        this.data.dressup.currentLevel = Math.max(1, Math.min(500, parseInt(lvl) || 1));
        this.saveData();
    }

    recordDressUpCompletion(levelId, itemsCount, customItemsConfig = null) {
        levelId = parseInt(levelId);
        this.data.dressup.decoratedLevels[levelId] = {
            itemsCount: itemsCount,
            date: new Date().toISOString()
        };

        if (customItemsConfig) {
            this.data.dressup.savedMurtis[levelId] = customItemsConfig;
        }

        if (levelId >= this.data.dressup.currentLevel && levelId < 500) {
            this.data.dressup.currentLevel = levelId + 1;
        }

        this.checkAchievements();
        this.saveData();
    }

    isDressUpDecorated(levelId) {
        return !!this.data.dressup.decoratedLevels[parseInt(levelId)];
    }

    // --- Nimarjanam Progress ---
    getNimarjanamCurrentLevel() {
        return this.data.nimarjanam.currentLevel || 1;
    }

    setNimarjanamCurrentLevel(lvl) {
        this.data.nimarjanam.currentLevel = Math.max(1, Math.min(500, parseInt(lvl) || 1));
        this.saveData();
    }

    recordNimarjanamCompletion(levelId) {
        levelId = parseInt(levelId);
        this.data.nimarjanam.immersedLevels[levelId] = {
            date: new Date().toISOString()
        };
        this.data.nimarjanam.totalImmersions = (this.data.nimarjanam.totalImmersions || 0) + 1;

        if (levelId >= this.data.nimarjanam.currentLevel && levelId < 500) {
            this.data.nimarjanam.currentLevel = levelId + 1;
        }

        this.checkAchievements();
        this.saveData();
    }

    isNimarjanamImmersed(levelId) {
        return !!(this.data.nimarjanam.immersedLevels && this.data.nimarjanam.immersedLevels[parseInt(levelId)]);
    }

    // --- Unified 3-Section Road Map Progression Helpers ---
    isLevelUnlocked(mode, levelId) {
        levelId = parseInt(levelId, 10) || 1;
        if (levelId <= 1) return true; // Level 1 is always unlocked

        if (mode === 'puzzle') {
            const cur = this.data.puzzle.currentLevel || 1;
            return levelId <= cur || this.isPuzzleCompleted(levelId - 1);
        } else if (mode === 'dressup') {
            const cur = this.data.dressup.currentLevel || 1;
            return levelId <= cur || this.isDressUpDecorated(levelId - 1);
        } else if (mode === 'nimarjanam') {
            const cur = this.data.nimarjanam.currentLevel || 1;
            return levelId <= cur || this.isNimarjanamImmersed(levelId - 1);
        }
        return false;
    }

    isLevelCompleted(mode, levelId) {
        levelId = parseInt(levelId, 10) || 1;
        if (mode === 'puzzle') return this.isPuzzleCompleted(levelId);
        if (mode === 'dressup') return this.isDressUpDecorated(levelId);
        if (mode === 'nimarjanam') return this.isNimarjanamImmersed(levelId);
        return false;
    }

    getCurrentUnlockedLevel(mode) {
        if (mode === 'puzzle') return this.data.puzzle.currentLevel || 1;
        if (mode === 'dressup') return this.data.dressup.currentLevel || 1;
        if (mode === 'nimarjanam') return this.data.nimarjanam.currentLevel || 1;
        return 1;
    }

    // --- Summary & Achievement Matrix ---
    getSummaryStats() {
        const puzzleCount = Object.keys(this.data.puzzle.completedLevels).length;
        const dressupCount = Object.keys(this.data.dressup.decoratedLevels).length;
        const nimarjanamCount = Object.keys(this.data.nimarjanam.immersedLevels).length;

        let totalStars = 0;
        Object.values(this.data.puzzle.completedLevels).forEach(stat => {
            totalStars += (stat.stars || 0);
        });

        return {
            puzzlesSolved: puzzleCount,
            idolsDecorated: dressupCount,
            idolsImmersed: nimarjanamCount,
            totalStars,
            totalScore: this.data.puzzle.totalScore || 0,
            completionPercentage: Math.round(((puzzleCount + dressupCount + nimarjanamCount) / (500 * 3)) * 100)
        };
    }

    checkAchievements() {
        const stats = this.getSummaryStats();
        const achs = [];

        if (stats.puzzlesSolved >= 1) achs.push("Pratham Pujya (Solved 1st Puzzle)");
        if (stats.puzzlesSolved >= 10) achs.push("Bhakti Sadhak (Solved 10 Puzzles)");
        if (stats.puzzlesSolved >= 50) achs.push("Vighnaharta Champion (Solved 50 Puzzles)");
        if (stats.puzzlesSolved >= 100) achs.push("Siddhivinayak Master (Solved 100 Puzzles)");
        if (stats.puzzlesSolved >= 500) achs.push("Maha Ganapati Maha Purush (All 500 Puzzles Solved!)");

        if (stats.idolsDecorated >= 1) achs.push("Murti Shilpakar (Decorated 1st Idol)");
        if (stats.idolsDecorated >= 10) achs.push("Royal Alankaram (Decorated 10 Idols)");
        if (stats.idolsDecorated >= 50) achs.push("Sanctum Sringar Samrat (50 Idols Decorated)");

        if (stats.idolsImmersed >= 1) achs.push("Ganga Snanam (1st Visarjan Complete)");
        if (stats.idolsImmersed >= 10) achs.push("Pudhchya Varshi Lavkar Ya (10 Visarjans)");
        if (stats.idolsImmersed >= 50) achs.push("Anant Chaturdashi Master (50 Visarjans)");

        this.data.achievements = achs;
    }

    resetAllProgress() {
        this.data = this.getDefaultData();
        this.saveData();
    }
}

// Global progress tracker singleton
window.progressTracker = new ProgressTracker();
