/**
 * Sacred Audio Synthesizer for Ganesh Chaturthi Web Game
 * Uses Web Audio API for high-fidelity, self-contained festival audio
 */

class SacredAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.volume = 0.7;
        this.ambientPlaying = false;
        this.ambientOscillators = [];
        this.dholInterval = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAmbient();
            this.stopDholRhythm();
        }
        return this.isMuted;
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
    }

    // --- 1. Resonant Temple Bell ---
    playTempleBell(frequency = 880, duration = 2.5) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Harmonics of a traditional Indian brass bell (fundamental + non-harmonic partials)
        const partials = [1, 2.02, 2.98, 4.15, 5.43];
        const gains = [0.6, 0.35, 0.25, 0.15, 0.08];

        partials.forEach((partial, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency * partial, now);

            // Fast strike attack, long exponential decay
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume * gains[i], now + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (1 + i * 0.3));

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // --- 2. Sacred Shankha (Conch Shell) Drone ---
    playShankha(duration = 2.8) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const baseFreq = 220; // Sacred conch drone around A3

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        // Frequency sweep simulating breath entering the conch
        osc1.frequency.setValueAtTime(baseFreq * 0.85, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + 0.5);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.98, now + duration);

        osc2.frequency.setValueAtTime((baseFreq * 1.5) * 0.85, now);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 * 1.05, now + 0.5);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 * 0.98, now + duration);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(4.0, now);

        // Swell in volume, sustain, gentle release
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.45, now + 0.6);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, now + duration - 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    // --- 3. Dhol-Tasha Strike & Festive Rhythm ---
    playDholStrike(isHigh = false) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Membrane pitch drop
        const startFreq = isHigh ? 240 : 110;
        const endFreq = isHigh ? 80 : 45;

        osc.type = isHigh ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

        // Punchy drum envelope
        gain.gain.setValueAtTime(this.volume * 0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Add subtle snare noise for Tasha snap
        if (isHigh) {
            const bufferSize = this.ctx.sampleRate * 0.08;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(this.volume * 0.35, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            noise.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }

        osc.start(now);
        osc.stop(now + 0.25);
    }

    startDholRhythm() {
        if (this.isMuted || this.dholInterval) return;
        this.init();
        let beat = 0;
        // 4/4 Dhol Tasha pattern: Dum, Tak-Tak, Dum-Dum, Tak!
        this.dholInterval = setInterval(() => {
            if (this.isMuted) {
                this.stopDholRhythm();
                return;
            }
            if (beat === 0) this.playDholStrike(false); // Dum
            else if (beat === 1) this.playDholStrike(true); // Tak
            else if (beat === 2) {
                this.playDholStrike(false);
                setTimeout(() => this.playDholStrike(false), 90); // Dum-Dum
            } else if (beat === 3) {
                this.playDholStrike(true);
                setTimeout(() => this.playDholStrike(true), 80);
            }
            beat = (beat + 1) % 4;
        }, 340);
    }

    stopDholRhythm() {
        if (this.dholInterval) {
            clearInterval(this.dholInterval);
            this.dholInterval = null;
        }
    }

    // --- 4. Water Splash & Ripples (Visarjan) ---
    playWaterSplash() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dur = 1.4;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + dur);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.7, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + dur);

        // Water droplet bubbles
        for (let j = 0; j < 5; j++) {
            setTimeout(() => {
                this.playBubblePop(700 + Math.random() * 500);
            }, 80 + j * 120);
        }
    }

    playBubblePop(freq = 900) {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.7, now + 0.08);

        gain.gain.setValueAtTime(this.volume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // --- 5. Piece Snap / Placement Click ---
    playPieceSnap() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.06);

        gain.gain.setValueAtTime(this.volume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // --- 6. Success Fanfare & Celebration Chimes ---
    playSuccessFanfare() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C Major arpeggio
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTempleBell(freq, 1.8);
            }, idx * 110);
        });
    }

    // --- 7. Ambient Shehnai / Sacred Tanpura Drone ---
    startAmbient() {
        if (this.isMuted || this.ambientPlaying) return;
        this.init();
        if (!this.ctx) return;

        this.ambientPlaying = true;
        const now = this.ctx.currentTime;
        const pitches = [146.83, 220.00, 293.66, 440.00]; // D, A, D, A tanpura chords

        this.ambientOscillators = pitches.map(pitch => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(pitch, now);

            // Subtle vibrato
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.setValueAtTime(0.2 + Math.random() * 0.3, now);
            lfoGain.gain.setValueAtTime(1.5, now);
            lfo.connect(osc.frequency);
            lfo.start(now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume * 0.05, now + 2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);

            return { osc, gain, lfo };
        });
    }

    stopAmbient() {
        if (!this.ambientPlaying) return;
        this.ambientPlaying = false;
        this.ambientOscillators.forEach(({ osc, gain, lfo }) => {
            try {
                const now = this.ctx.currentTime;
                gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
                setTimeout(() => {
                    osc.stop();
                    lfo.stop();
                }, 850);
            } catch (e) {}
        });
        this.ambientOscillators = [];
    }

    toggleAmbient() {
        if (this.ambientPlaying) {
            this.stopAmbient();
            return false;
        } else {
            this.startAmbient();
            return true;
        }
    }

    // --- 8. Candy Crush Style Star Pop & Celebration Sounds ---
    playStarPop(index = 0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const freq = freqs[index % freqs.length];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.75, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.22);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.55, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
    }

    playScoreTick() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100 + Math.random() * 200, now);
        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
    }

    playTimesUp() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [440, 392, 349, 311]; // Descending sad tones
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.18);
            gain.gain.setValueAtTime(0, now + i * 0.18);
            gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + i * 0.18 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.18);
            osc.stop(now + i * 0.18 + 0.4);
        });
    }
}

// Global audio singleton
window.sacredAudio = new SacredAudioEngine();
