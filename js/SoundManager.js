// Sound Manager - Generates and plays synthesized sound effects
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    // Resume audio context (required after user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Create an oscillator-based sound
    playTone(frequency, duration, type = 'square', volumeMod = 1, attack = 0.01, decay = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        const now = this.audioContext.currentTime;
        const vol = this.volume * volumeMod;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play frequency sweep
    playSweep(startFreq, endFreq, duration, type = 'square', volumeMod = 1) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        
        const now = this.audioContext.currentTime;
        oscillator.frequency.setValueAtTime(startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        const vol = this.volume * volumeMod;
        gainNode.gain.setValueAtTime(vol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play noise burst (for explosions)
    playNoise(duration, volumeMod = 1) {
        if (!this.enabled || !this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        const vol = this.volume * volumeMod;

        gainNode.gain.setValueAtTime(vol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.start(now);
        noise.stop(now + duration);
    }

    // === GAME SOUND EFFECTS ===

    // Player laser - high pitched zap
    playerLaser() {
        this.playSweep(880, 440, 0.08, 'square', 0.4);
    }

    // Enemy laser - lower pitched pew
    enemyLaser() {
        this.playSweep(330, 110, 0.15, 'sawtooth', 0.3);
    }

    // Power-up collected - ascending chime
    powerUp() {
        const now = this.audioContext?.currentTime || 0;
        this.playTone(523, 0.1, 'sine', 0.5); // C5
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.5), 50); // E5
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.5), 100); // G5
        setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.6), 150); // C6
    }

    // Power core collected - magical ascending
    powerCore() {
        this.playSweep(200, 800, 0.3, 'sine', 0.5);
        setTimeout(() => this.playTone(800, 0.2, 'triangle', 0.4), 100);
    }

    // Mega blast - powerful bass sweep with overtones
    megaBlast() {
        this.playSweep(80, 200, 0.5, 'sawtooth', 0.8);
        this.playNoise(0.3, 0.4);
        setTimeout(() => this.playSweep(200, 400, 0.3, 'square', 0.5), 100);
    }

    // Shield hit - metallic ping
    shieldHit() {
        this.playTone(600, 0.1, 'triangle', 0.4);
        this.playTone(800, 0.08, 'sine', 0.3);
    }

    // Shield break - shattering sound
    shieldBreak() {
        this.playNoise(0.2, 0.5);
        this.playSweep(800, 200, 0.3, 'square', 0.4);
        setTimeout(() => this.playNoise(0.15, 0.3), 100);
    }

    // Small explosion (enemy destroyed)
    explosion() {
        this.playNoise(0.2, 0.5);
        this.playSweep(200, 50, 0.2, 'sawtooth', 0.4);
    }

    // Earth hit - rumble
    earthHit() {
        this.playNoise(0.15, 0.4);
        this.playTone(80, 0.2, 'sine', 0.5);
    }

    // Earth explosion - massive rumble
    earthExplosion() {
        this.playNoise(0.8, 0.7);
        this.playSweep(150, 30, 0.8, 'sawtooth', 0.6);
        setTimeout(() => {
            this.playNoise(0.5, 0.5);
            this.playSweep(100, 20, 0.6, 'sine', 0.5);
        }, 200);
        setTimeout(() => this.playNoise(0.4, 0.4), 500);
    }

    // Mothership explosion - dramatic
    mothershipExplosion() {
        this.playNoise(0.6, 0.6);
        this.playSweep(200, 40, 0.6, 'sawtooth', 0.5);
        setTimeout(() => {
            this.playNoise(0.4, 0.5);
            this.playSweep(300, 60, 0.4, 'square', 0.4);
        }, 150);
        setTimeout(() => {
            this.playNoise(0.5, 0.4);
            this.playTone(50, 0.5, 'sine', 0.5);
        }, 350);
    }

    // Mothership damaged
    mothershipHit() {
        this.playNoise(0.3, 0.5);
        this.playSweep(300, 100, 0.3, 'sawtooth', 0.5);
    }

    // Game over
    gameOver() {
        this.playSweep(400, 100, 0.5, 'sawtooth', 0.5);
        setTimeout(() => this.playSweep(300, 80, 0.5, 'sawtooth', 0.4), 300);
        setTimeout(() => this.playSweep(200, 50, 0.8, 'sawtooth', 0.5), 600);
    }

    // Victory fanfare
    victory() {
        const notes = [523, 659, 784, 1047, 784, 1047]; // C E G C G C
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'square', 0.5), i * 120);
        });
        setTimeout(() => this.playTone(1047, 0.5, 'sine', 0.6), 700);
    }

    // Toggle sound
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Set volume (0 to 1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Create global sound manager instance
const soundManager = new SoundManager();
