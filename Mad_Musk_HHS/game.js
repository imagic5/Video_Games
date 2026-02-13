// ============================================
// MAD MUSK - A Duke Nukem Style Side-Scroller
// Stage 1: Revenge Begins
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions (classic DOS game resolution scaled up)
const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game States
const GameState = {
    TITLE: 'title',
    INTRO: 'intro',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
    STAGE_COMPLETE: 'complete'
};

// Game variables
let gameState = GameState.TITLE;
let introPage = 0;
let score = 0;
let cameraX = 0;

// Screen shake system
let screenShake = {
    intensity: 0,
    duration: 0,
    offsetX: 0,
    offsetY: 0,
    
    trigger(intensity, duration) {
        this.intensity = intensity;
        this.duration = duration;
    },
    
    update() {
        if (this.duration > 0) {
            this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
            this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
            this.duration--;
            this.intensity *= 0.95;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }
};

// Particle system
class Particle {
    constructor(x, y, color, velX, velY, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velX = velX;
        this.velY = velY;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = 0.2;
    }
    
    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.velY += this.gravity;
        this.life--;
        return this.life > 0;
    }
    
    draw(ctx, cameraX) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - cameraX, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

let particles = [];

function spawnParticles(x, y, count, colors, speed = 5) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const velocity = speed * (0.5 + Math.random() * 0.5);
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(
            x, y, color,
            Math.cos(angle) * velocity,
            Math.sin(angle) * velocity - 2,
            30 + Math.random() * 20,
            3 + Math.random() * 4
        ));
    }
}

// Web Audio API Sound System
const AudioSystem = {
    context: null,
    enabled: true,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio not supported');
            this.enabled = false;
        }
    },
    
    play(type) {
        if (!this.enabled || !this.context) return;
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        switch(type) {
            case 'shoot':
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                osc.start();
                osc.stop(this.context.currentTime + 0.1);
                break;
                
            case 'shotgun':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                osc.start();
                osc.stop(this.context.currentTime + 0.2);
                break;
                
            case 'explosion':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(20, this.context.currentTime + 0.3);
                gain.gain.setValueAtTime(0.25, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                osc.start();
                osc.stop(this.context.currentTime + 0.3);
                break;
                
            case 'hurt':
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.15);
                gain.gain.setValueAtTime(0.12, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
                osc.start();
                osc.stop(this.context.currentTime + 0.15);
                break;
                
            case 'pickup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
                osc.start();
                osc.stop(this.context.currentTime + 0.15);
                break;
                
            case 'boss_hit':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(80, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                osc.start();
                osc.stop(this.context.currentTime + 0.2);
                break;
                
            case 'jump':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
                gain.gain.setValueAtTime(0.08, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                osc.start();
                osc.stop(this.context.currentTime + 0.1);
                break;
        }
    }
};

// Initialize audio on first interaction
document.addEventListener('click', () => AudioSystem.init(), { once: true });
document.addEventListener('keydown', () => AudioSystem.init(), { once: true });

// 1980s Retro Synthwave/Dystopian Sci-Fi Music System
const MusicSystem = {
    context: null,
    masterGain: null,
    isPlaying: false,
    bpm: 110,
    currentBeat: 0,
    scheduledTime: 0,
    timerID: null,
    oscillators: [],
    
    // D minor scale - dark and dystopian
    scale: [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63, 293.66], // D3 to D4
    bassNotes: [73.42, 82.41, 87.31, 98.00], // D2, E2, F2, G2
    
    // Patterns (16 steps each)
    bassPattern: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
    kickPattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snarePattern: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihatPattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
    arpPattern: [0,1,0,1, 0,1,0,0, 0,1,0,1, 0,0,1,0],
    
    init() {
        if (this.context) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.context.destination);
        } catch (e) {
            console.log('Music system unavailable');
        }
    },
    
    start() {
        if (!this.context || this.isPlaying || musicMuted) return;
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        this.isPlaying = true;
        this.currentBeat = 0;
        this.scheduledTime = this.context.currentTime;
        this.scheduleNotes();
    },
    
    stop() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        // Stop all oscillators
        this.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
    },
    
    scheduleNotes() {
        if (!this.isPlaying) return;
        
        const beatDuration = 60 / this.bpm / 4; // 16th notes
        const lookAhead = 0.1;
        const scheduleAhead = 0.2;
        
        while (this.scheduledTime < this.context.currentTime + scheduleAhead) {
            const step = this.currentBeat % 16;
            const bar = Math.floor(this.currentBeat / 16) % 4;
            
            // Bass synth - deep and ominous
            if (this.bassPattern[step]) {
                this.playBass(this.scheduledTime, this.bassNotes[bar % 4], beatDuration * 2);
            }
            
            // Kick drum
            if (this.kickPattern[step]) {
                this.playKick(this.scheduledTime);
            }
            
            // Snare
            if (this.snarePattern[step]) {
                this.playSnare(this.scheduledTime);
            }
            
            // Hi-hat
            if (this.hihatPattern[step]) {
                this.playHihat(this.scheduledTime, step % 4 === 3 ? 0.08 : 0.05);
            }
            
            // Arpeggio - synthwave style
            if (this.arpPattern[step]) {
                const noteIndex = (step + bar * 2) % this.scale.length;
                this.playArp(this.scheduledTime, this.scale[noteIndex], beatDuration * 1.5);
            }
            
            // Atmospheric pad (every 16 beats)
            if (step === 0) {
                this.playPad(this.scheduledTime, this.bassNotes[bar % 4] * 2, beatDuration * 16);
            }
            
            this.scheduledTime += beatDuration;
            this.currentBeat++;
        }
        
        this.timerID = setTimeout(() => this.scheduleNotes(), lookAhead * 1000);
    },
    
    playBass(time, freq, duration) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, time);
        filter.frequency.exponentialRampToValueAtTime(800, time + 0.05);
        filter.frequency.exponentialRampToValueAtTime(150, time + duration);
        filter.Q.value = 8;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + duration);
        this.oscillators.push(osc);
    },
    
    playKick(time) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.15);
        this.oscillators.push(osc);
    },
    
    playSnare(time) {
        // Noise burst for snare
        const bufferSize = this.context.sampleRate * 0.1;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        // Add body tone
        const osc = this.context.createOscillator();
        const oscGain = this.context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);
        oscGain.gain.setValueAtTime(0.15, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        noise.start(time);
        osc.start(time);
        osc.stop(time + 0.1);
        this.oscillators.push(osc);
    },
    
    playHihat(time, volume) {
        const bufferSize = this.context.sampleRate * 0.05;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(time);
    },
    
    playArp(time, freq, duration) {
        const osc = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        // Detuned saw waves for that 80s synth sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.005, time); // Slight detune
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(500, time + duration);
        filter.Q.value = 2;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.01);
        gain.gain.setValueAtTime(0.08, time + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc2.start(time);
        osc.stop(time + duration);
        osc2.stop(time + duration);
        this.oscillators.push(osc, osc2);
    },
    
    playPad(time, freq, duration) {
        // Atmospheric pad with multiple detuned oscillators
        const oscs = [];
        const detunes = [-15, -5, 0, 5, 15];
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.linearRampToValueAtTime(800, time + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(300, time + duration);
        filter.Q.value = 1;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + duration * 0.3);
        gain.gain.setValueAtTime(0.06, time + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        
        detunes.forEach(detune => {
            const osc = this.context.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);
            osc.detune.setValueAtTime(detune, time);
            osc.connect(filter);
            osc.start(time);
            osc.stop(time + duration);
            oscs.push(osc);
        });
        
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        this.oscillators.push(...oscs);
    },
    
    setVolume(vol) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
        }
    }
};

// Weapon system
const Weapons = {
    PISTOL: 0,
    SHOTGUN: 1
};

let currentWeapon = Weapons.PISTOL;
let shotgunAmmo = 0;
let musicMuted = false;

// Story text for intro
const storyPages = [
    {
        title: "MAD MUSK",
        text: [
            "Los Angeles, 2087.",
            "",
            "Neon Musk was once humanity's greatest hope.",
            "He built AI robots to clean the streets.",
            "Electric self-driving cars reduced carbon emissions.",
            "Drones delivered medicine to those in need.",
            "",
            "He was on the verge of curing cancer...",
            "",
            "[PRESS ENTER TO CONTINUE]"
        ]
    },
    {
        title: "THE FALL",
        text: [
            "But Musk tested his experimental brain cancer",
            "treatment on himself. It failed catastrophically.",
            "",
            "His brilliant mind became corrupted.",
            "His compassion turned to cold indifference.",
            "",
            "He built a rocket to abandon Earth,",
            "leaving humanity to fend for itself.",
            "",
            "[PRESS ENTER TO CONTINUE]"
        ]
    },
    {
        title: "THE TRAGEDY",
        text: [
            "The rocket exploded over Los Angeles.",
            "",
            "Quantum fuel and debris rained from the sky.",
            "A piece of the engine fell on a car...",
            "",
            "Sarah Newcomb was picking up her son",
            "Tommy from school that day.",
            "",
            "They never made it home.",
            "",
            "[PRESS ENTER TO CONTINUE]"
        ]
    },
    {
        title: "LUKE NEWCOMB",
        text: [
            "Luke Newcomb lost everything that day.",
            "",
            "His wife. His son. His reason to live.",
            "",
            "But from the ashes of grief rose something else:",
            "",
            "VENGEANCE.",
            "",
            "Musk's robots now patrol the ruined streets.",
            "His drones hunt survivors. His cars kill on sight.",
            "",
            "[PRESS ENTER TO BEGIN]"
        ]
    }
];

// Player class
class Player {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 100;
        this.y = 400;
        this.width = 28;
        this.height = 48;
        this.velX = 0;
        this.velY = 0;
        this.speed = 5;
        this.jumpForce = -14;
        this.onGround = false;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 50;
        this.facing = 1; // 1 = right, -1 = left
        this.shooting = false;
        this.shootCooldown = 0;
        this.invincible = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.walking = false;
    }
    
    update(keys, platforms, enemies) {
        // Horizontal movement
        this.walking = false;
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.velX = -this.speed;
            this.facing = -1;
            this.walking = true;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            this.velX = this.speed;
            this.facing = 1;
            this.walking = true;
        } else {
            this.velX *= 0.8;
        }
        
        // Jumping
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.onGround) {
            this.velY = this.jumpForce;
            this.onGround = false;
            AudioSystem.play('jump');
        }
        
        // Gravity
        this.velY += 0.6;
        if (this.velY > 15) this.velY = 15;
        
        // Apply velocity
        this.x += this.velX;
        this.y += this.velY;
        
        // Platform collision
        this.onGround = false;
        for (let platform of platforms) {
            if (this.collidesWith(platform)) {
                // Determine collision side
                const overlapLeft = (this.x + this.width) - platform.x;
                const overlapRight = (platform.x + platform.width) - this.x;
                const overlapTop = (this.y + this.height) - platform.y;
                const overlapBottom = (platform.y + platform.height) - this.y;
                
                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);
                
                if (minOverlapY < minOverlapX) {
                    if (overlapTop < overlapBottom) {
                        this.y = platform.y - this.height;
                        this.velY = 0;
                        this.onGround = true;
                    } else {
                        this.y = platform.y + platform.height;
                        this.velY = 0;
                    }
                } else {
                    if (overlapLeft < overlapRight) {
                        this.x = platform.x - this.width;
                    } else {
                        this.x = platform.x + platform.width;
                    }
                    this.velX = 0;
                }
            }
        }
        
        // World bounds
        if (this.x < 0) this.x = 0;
        if (this.y > GAME_HEIGHT) {
            this.health = 0;
        }
        
        // Shooting cooldown
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        // Invincibility frames
        if (this.invincible > 0) this.invincible--;
        
        // Animation
        this.animTimer++;
        if (this.animTimer > 6) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    shoot() {
        if (this.shootCooldown <= 0 && this.ammo > 0) {
            this.ammo--;
            this.shootCooldown = 15;
            this.shooting = true;
            setTimeout(() => this.shooting = false, 100);
            AudioSystem.play('shoot');
            return [new Bullet(
                this.x + this.width/2 + (this.facing * 20),
                this.y + 18,
                this.facing * 12
            )];
        }
        return [];
    }
    
    shootShotgun() {
        if (this.shootCooldown <= 0 && shotgunAmmo > 0) {
            shotgunAmmo--;
            this.shootCooldown = 30; // Longer cooldown for shotgun
            this.shooting = true;
            setTimeout(() => this.shooting = false, 150);
            AudioSystem.play('shotgun');
            screenShake.trigger(4, 8);
            
            // Fire 5 pellets in a spread
            const pellets = [];
            const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3];
            for (let angle of spreadAngles) {
                pellets.push(new ShotgunPellet(
                    this.x + this.width/2 + (this.facing * 20),
                    this.y + 18,
                    this.facing,
                    angle
                ));
            }
            return pellets;
        }
        return [];
    }
    
    takeDamage(amount) {
        if (this.invincible <= 0) {
            this.health -= amount;
            this.invincible = 60;
            if (this.health < 0) this.health = 0;
        }
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        
        // Flash when invincible
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw Luke Newcomb
        ctx.save();
        ctx.translate(screenX + this.width/2, this.y);
        ctx.scale(this.facing, 1);
        
        // Body (brown jacket)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-12, 16, 24, 24);
        
        // Legs
        const legOffset = this.walking ? Math.sin(this.animFrame * Math.PI / 2) * 4 : 0;
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(-10, 40, 8, 12);
        ctx.fillRect(2, 40, 8, 12);
        
        // Boots
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-12, 48, 10, 6);
        ctx.fillRect(2, 48, 10, 6);
        
        // Head
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(-8, 0, 16, 18);
        
        // Hair (dark)
        ctx.fillStyle = '#2F1F0F';
        ctx.fillRect(-9, -2, 18, 6);
        
        // Eyes (determined look)
        ctx.fillStyle = '#000';
        ctx.fillRect(-5, 6, 3, 3);
        ctx.fillRect(2, 6, 3, 3);
        
        // Stubble
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(-6, 12, 12, 4);
        
        // Arm with gun
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 18, 8, 6);
        
        // Gun
        ctx.fillStyle = '#333';
        ctx.fillRect(14, 16, 16, 8);
        ctx.fillStyle = '#666';
        ctx.fillRect(14, 18, 12, 4);
        
        // Muzzle flash when shooting
        if (this.shooting) {
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(32, 20, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.arc(32, 20, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

// Bullet class
class Bullet {
    constructor(x, y, velX) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 4;
        this.velX = velX;
        this.active = true;
    }
    
    update() {
        this.x += this.velX;
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        ctx.fillStyle = '#ff0';
        ctx.fillRect(screenX, this.y, this.width, this.height);
        ctx.fillStyle = '#f80';
        ctx.fillRect(screenX + 2, this.y + 1, this.width - 4, 2);
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

// Shotgun pellet class
class ShotgunPellet {
    constructor(x, y, facing, angle) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 6;
        this.speed = 14;
        this.velX = Math.cos(angle) * this.speed * facing;
        this.velY = Math.sin(angle) * this.speed;
        this.active = true;
        this.life = 20; // Short range
        this.damage = 15;
    }
    
    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.life--;
        if (this.life <= 0) this.active = false;
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const alpha = this.life / 20;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff8';
        ctx.beginPath();
        ctx.arc(screenX, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

// Enemy types
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.animFrame = 0;
        this.animTimer = 0;
        this.facing = -1;
        
        switch(type) {
            case 'robot':
                this.width = 32;
                this.height = 48;
                this.health = 30;
                this.speed = 0.8;  // Slowed down
                this.damage = 8;   // Less damage
                this.points = 100;
                break;
            case 'drone':
                this.width = 40;
                this.height = 24;
                this.health = 10;  // Dies in 1 hit
                this.speed = 1.5;  // Slowed down
                this.damage = 5;   // Less damage
                this.points = 150;
                this.floatOffset = 0;
                break;
            case 'car':
                this.width = 80;
                this.height = 36;
                this.health = 60;
                this.speed = 2.5;  // Slowed down
                this.damage = 15;  // Less damage
                this.points = 250;
                break;
            case 'turret':
                this.width = 32;
                this.height = 32;
                this.health = 40;
                this.speed = 0;
                this.damage = 10;  // Less damage
                this.points = 200;
                this.shootTimer = 0;
                break;
        }
        
        this.maxHealth = this.health;
        this.startX = x;
        this.patrolRange = 150;
        this.direction = 1;
    }
    
    update(player, bullets, platforms) {
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        // Face player
        if (player.x < this.x) this.facing = -1;
        else this.facing = 1;
        
        switch(this.type) {
            case 'robot':
                // Patrol back and forth
                this.x += this.speed * this.direction;
                if (this.x > this.startX + this.patrolRange) this.direction = -1;
                if (this.x < this.startX - this.patrolRange) this.direction = 1;
                break;
                
            case 'drone':
                // Float and chase player
                this.floatOffset = Math.sin(Date.now() / 200) * 10;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 400) {
                    const newX = this.x + (dx / dist) * this.speed;
                    const newY = this.y + (dy / dist) * this.speed * 0.5;
                    
                    // Check collision with platforms before moving
                    let canMoveX = true;
                    let canMoveY = true;
                    for (let platform of platforms) {
                        // Check horizontal movement
                        if (this.wouldCollide(newX, this.y, platform)) canMoveX = false;
                        // Check vertical movement
                        if (this.wouldCollide(this.x, newY, platform)) canMoveY = false;
                    }
                    if (canMoveX) this.x = newX;
                    if (canMoveY) this.y = newY;
                }
                break;
                
            case 'car':
                // Charge at player when in range
                if (Math.abs(player.x - this.x) < 500 && Math.abs(player.y - this.y) < 50) {
                    const newX = this.x + this.speed * this.facing;
                    // Check collision with platforms/buildings before moving
                    let blocked = false;
                    for (let platform of platforms) {
                        if (this.wouldCollide(newX, this.y, platform)) {
                            blocked = true;
                            break;
                        }
                    }
                    if (!blocked) this.x = newX;
                }
                break;
                
            case 'turret':
                this.shootTimer++;
                if (this.shootTimer > 150) {  // Shoots less frequently
                    this.shootTimer = 0;
                    // Create enemy bullet
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    bullets.push(new EnemyBullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        Math.cos(angle) * 6,
                        Math.sin(angle) * 6
                    ));
                }
                break;
        }
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const screenY = this.type === 'drone' ? this.y + this.floatOffset : this.y;
        
        ctx.save();
        
        switch(this.type) {
            case 'robot':
                // Musk's cleaning robot gone hostile
                // Body
                ctx.fillStyle = '#404040';
                ctx.fillRect(screenX + 4, screenY + 16, 24, 28);
                
                // Head
                ctx.fillStyle = '#505050';
                ctx.fillRect(screenX + 6, screenY, 20, 18);
                
                // Evil red eyes
                ctx.fillStyle = '#f00';
                ctx.fillRect(screenX + 8, screenY + 6, 6, 4);
                ctx.fillRect(screenX + 18, screenY + 6, 6, 4);
                
                // Arms
                ctx.fillStyle = '#303030';
                ctx.fillRect(screenX - 4, screenY + 18, 8, 20);
                ctx.fillRect(screenX + 28, screenY + 18, 8, 20);
                
                // Legs
                ctx.fillRect(screenX + 6, screenY + 44, 8, 8);
                ctx.fillRect(screenX + 18, screenY + 44, 8, 8);
                
                // Musk logo (M)
                ctx.fillStyle = '#0af';
                ctx.font = '12px monospace';
                ctx.fillText('M', screenX + 12, screenY + 34);
                break;
                
            case 'drone':
                // Delivery drone turned hunter
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(screenX, screenY + 8, 40, 12);
                
                // Rotors
                const rotorOffset = this.animFrame * 2;
                ctx.fillStyle = '#555';
                ctx.fillRect(screenX - 5 + rotorOffset, screenY, 15, 4);
                ctx.fillRect(screenX + 30 - rotorOffset, screenY, 15, 4);
                
                // Camera eye
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(screenX + 20, screenY + 18, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Grabber claws
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX + 8, screenY + 20, 4, 8);
                ctx.fillRect(screenX + 28, screenY + 20, 4, 8);
                break;
                
            case 'car':
                // Self-driving car gone murderous
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(screenX, screenY + 10, 80, 20);
                
                // Roof
                ctx.fillStyle = '#16213e';
                ctx.fillRect(screenX + 15, screenY, 50, 14);
                
                // Windows
                ctx.fillStyle = '#e94560';
                ctx.fillRect(screenX + 20, screenY + 2, 18, 10);
                ctx.fillRect(screenX + 42, screenY + 2, 18, 10);
                
                // Wheels
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(screenX + 15, screenY + 32, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.arc(screenX + 65, screenY + 32, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Headlights
                ctx.fillStyle = this.facing > 0 ? '#ff0' : '#600';
                ctx.fillRect(screenX + 75, screenY + 14, 5, 6);
                ctx.fillStyle = this.facing < 0 ? '#ff0' : '#600';
                ctx.fillRect(screenX, screenY + 14, 5, 6);
                break;
                
            case 'turret':
                // Automated security turret
                ctx.fillStyle = '#444';
                ctx.fillRect(screenX, screenY + 16, 32, 16);
                
                // Gun barrel
                ctx.fillStyle = '#333';
                ctx.save();
                ctx.translate(screenX + 16, screenY + 20);
                ctx.rotate(Math.atan2(this.facing, 1));
                ctx.fillRect(0, -4, 24, 8);
                ctx.restore();
                
                // Sensor
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(screenX + 16, screenY + 8, 6, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#300';
        ctx.fillRect(screenX, screenY - 8, this.width, 4);
        ctx.fillStyle = '#f00';
        ctx.fillRect(screenX, screenY - 8, this.width * healthPercent, 4);
        
        ctx.restore();
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    wouldCollide(newX, newY, platform) {
        return newX < platform.x + platform.width &&
               newX + this.width > platform.x &&
               newY < platform.y + platform.height &&
               newY + this.height > platform.y;
    }
}

// Enemy bullet class
class EnemyBullet {
    constructor(x, y, velX, velY) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.width = 8;
        this.height = 8;
        this.active = true;
    }
    
    update() {
        this.x += this.velX;
        this.y += this.velY;
    }
    
    draw(ctx, cameraX) {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f80';
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

// Pickup class
class Pickup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 24;
        this.height = 24;
        this.active = true;
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.floatOffset += 0.05;
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const floatY = this.y + Math.sin(this.floatOffset) * 4;
        
        ctx.save();
        
        switch(this.type) {
            case 'health':
                // First aid kit
                ctx.fillStyle = '#fff';
                ctx.fillRect(screenX, floatY, 24, 24);
                ctx.fillStyle = '#f00';
                ctx.fillRect(screenX + 10, floatY + 4, 4, 16);
                ctx.fillRect(screenX + 4, floatY + 10, 16, 4);
                break;
                
            case 'ammo':
                // Ammo box
                ctx.fillStyle = '#654321';
                ctx.fillRect(screenX, floatY, 24, 24);
                ctx.fillStyle = '#ff0';
                ctx.fillRect(screenX + 4, floatY + 8, 6, 12);
                ctx.fillRect(screenX + 14, floatY + 8, 6, 12);
                break;
                
            case 'shotgun':
                // Shotgun pickup!
                ctx.fillStyle = '#444';
                ctx.fillRect(screenX, floatY + 8, 28, 8);
                ctx.fillStyle = '#654321';
                ctx.fillRect(screenX + 14, floatY + 4, 14, 16);
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX - 4, floatY + 6, 8, 12);
                // Shells
                ctx.fillStyle = '#f00';
                ctx.fillRect(screenX + 18, floatY + 8, 4, 4);
                ctx.fillRect(screenX + 24, floatY + 8, 4, 4);
                break;
        }
        
        // Glow effect
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.type === 'health' ? '#f00' : 
                        this.type === 'shotgun' ? '#f80' : '#ff0';
        ctx.beginPath();
        ctx.arc(screenX + 12, floatY + 12, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

// Platform/Level geometry
class Platform {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }
    
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        
        switch(this.type) {
            case 'ground':
                // Street/ground
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX, this.y, this.width, this.height);
                // Road markings
                ctx.fillStyle = '#ff0';
                for (let i = 0; i < this.width; i += 80) {
                    ctx.fillRect(screenX + i + 20, this.y + 4, 40, 4);
                }
                // Cracks
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 2;
                for (let i = 0; i < this.width; i += 120) {
                    ctx.beginPath();
                    ctx.moveTo(screenX + i + 50, this.y);
                    ctx.lineTo(screenX + i + 60, this.y + this.height);
                    ctx.stroke();
                }
                break;
                
            case 'building':
                // Building/wall
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(screenX, this.y, this.width, this.height);
                // Windows
                ctx.fillStyle = '#2a4a6a';
                for (let row = 0; row < this.height - 32; row += 48) {
                    for (let col = 16; col < this.width - 16; col += 48) {
                        ctx.fillRect(screenX + col, this.y + row + 16, 24, 28);
                        // Some windows lit
                        if (Math.random() > 0.7) {
                            ctx.fillStyle = '#ffa';
                            ctx.fillRect(screenX + col + 2, this.y + row + 18, 20, 24);
                            ctx.fillStyle = '#2a4a6a';
                        }
                    }
                }
                break;
                
            case 'debris':
                // Rocket debris
                ctx.fillStyle = '#666';
                ctx.fillRect(screenX, this.y, this.width, this.height);
                ctx.fillStyle = '#888';
                ctx.fillRect(screenX + 4, this.y + 4, this.width - 8, this.height/2);
                // Scorch marks
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(screenX + this.width/2, this.y + this.height, this.width/2, Math.PI, 0);
                ctx.fill();
                break;
                
            case 'platform':
                // Floating platform
                ctx.fillStyle = '#555';
                ctx.fillRect(screenX, this.y, this.width, this.height);
                ctx.fillStyle = '#666';
                ctx.fillRect(screenX, this.y, this.width, 8);
                // Caution stripes
                ctx.fillStyle = '#fc0';
                for (let i = 0; i < this.width; i += 24) {
                    ctx.fillRect(screenX + i, this.y, 12, 4);
                }
                break;
                
            default:
                ctx.fillStyle = '#555';
                ctx.fillRect(screenX, this.y, this.width, this.height);
        }
    }
}

// Boss class - CLEANERBOT-X (Stage 1 Boss)
class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 160;
        this.health = 500;
        this.maxHealth = 500;
        this.active = true;
        this.phase = 1;
        this.facing = -1;
        this.animFrame = 0;
        this.animTimer = 0;
        this.attackTimer = 0;
        this.attackPattern = 0;
        this.isAttacking = false;
        this.invincible = 0;
        this.chargeVelX = 0;
        this.shakeTimer = 0;
        
        // Laser beam properties
        this.laserActive = false;
        this.laserAngle = 0;
        this.laserTimer = 0;
        
        // Spawn properties  
        this.spawnTimer = 0;
    }
    
    update(player, bullets, enemyBullets, enemies) {
        if (!this.active) return;
        
        // Animation
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        // Face player
        if (player.x < this.x + this.width/2) this.facing = -1;
        else this.facing = 1;
        
        // Invincibility
        if (this.invincible > 0) this.invincible--;
        
        // Shake when damaged
        if (this.shakeTimer > 0) this.shakeTimer--;
        
        // Attack patterns based on phase
        this.attackTimer++;
        
        // Phase transitions
        if (this.health <= this.maxHealth * 0.6 && this.phase === 1) {
            this.phase = 2;
            screenShake.trigger(10, 30);
            spawnParticles(this.x + this.width/2, this.y + this.height/2, 30, ['#f00', '#f80', '#ff0']);
        }
        if (this.health <= this.maxHealth * 0.3 && this.phase === 2) {
            this.phase = 3;
            screenShake.trigger(15, 40);
            spawnParticles(this.x + this.width/2, this.y + this.height/2, 40, ['#f00', '#800', '#f80']);
        }
        
        const attackInterval = this.phase === 1 ? 120 : (this.phase === 2 ? 90 : 60);
        
        if (this.attackTimer >= attackInterval) {
            this.attackTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % (this.phase + 2);
            
            switch(this.attackPattern) {
                case 0: // Shoot spread
                    this.shootSpread(player, enemyBullets);
                    break;
                case 1: // Charge attack
                    if (this.phase >= 2) this.startCharge(player);
                    break;
                case 2: // Laser sweep
                    if (this.phase >= 2) this.startLaser();
                    break;
                case 3: // Spawn minions
                    if (this.phase === 3) this.spawnMinions(enemies);
                    break;
            }
        }
        
        // Update charge
        if (Math.abs(this.chargeVelX) > 0) {
            this.x += this.chargeVelX;
            this.chargeVelX *= 0.98;
            if (Math.abs(this.chargeVelX) < 0.5) this.chargeVelX = 0;
            
            // Bounds (boss arena: 8600-9550)
            if (this.x < 8650) this.x = 8650;
            if (this.x > 9400 - this.width) this.x = 9400 - this.width;
        }
        
        // Update laser
        if (this.laserActive) {
            this.laserTimer++;
            this.laserAngle = Math.sin(this.laserTimer * 0.05) * 0.5;
            
            if (this.laserTimer > 90) {
                this.laserActive = false;
                this.laserTimer = 0;
            }
        }
    }
    
    shootSpread(player, enemyBullets) {
        AudioSystem.play('explosion');
        const angles = this.phase === 1 ? [-0.4, -0.2, 0, 0.2, 0.4] : 
                       this.phase === 2 ? [-0.5, -0.3, -0.1, 0.1, 0.3, 0.5] :
                       [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6];
        
        for (let angle of angles) {
            const baseAngle = Math.atan2(player.y - this.y - 60, player.x - this.x - 60);
            enemyBullets.push(new EnemyBullet(
                this.x + this.width/2,
                this.y + 60,
                Math.cos(baseAngle + angle) * 8,
                Math.sin(baseAngle + angle) * 8
            ));
        }
    }
    
    startCharge(player) {
        this.chargeVelX = player.x < this.x ? -12 : 12;
        screenShake.trigger(5, 20);
        AudioSystem.play('boss_hit');
    }
    
    startLaser() {
        this.laserActive = true;
        this.laserTimer = 0;
        AudioSystem.play('explosion');
    }
    
    spawnMinions(enemies) {
        // Spawn 2 drones
        enemies.push(new Enemy(this.x - 50, this.y, 'drone'));
        enemies.push(new Enemy(this.x + this.width + 50, this.y, 'drone'));
        spawnParticles(this.x, this.y + 40, 10, ['#0af', '#08f']);
        spawnParticles(this.x + this.width, this.y + 40, 10, ['#0af', '#08f']);
    }
    
    takeDamage(amount) {
        if (this.invincible <= 0) {
            this.health -= amount;
            this.invincible = 10;
            this.shakeTimer = 10;
            AudioSystem.play('boss_hit');
            screenShake.trigger(3, 5);
            spawnParticles(this.x + this.width/2, this.y + this.height/2, 5, ['#f00', '#f80', '#ff0']);
            
            if (this.health <= 0) {
                this.active = false;
                screenShake.trigger(20, 60);
                AudioSystem.play('explosion');
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        spawnParticles(
                            this.x + Math.random() * this.width,
                            this.y + Math.random() * this.height,
                            20, ['#f00', '#f80', '#ff0', '#fff']
                        );
                        AudioSystem.play('explosion');
                    }, i * 150);
                }
            }
        }
    }
    
    draw(ctx, cameraX) {
        if (!this.active) return;
        
        const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
        const screenX = this.x - cameraX + shakeX;
        
        ctx.save();
        
        // Draw CLEANERBOT-X
        // Main body (large cleaning robot)
        ctx.fillStyle = this.phase === 1 ? '#505050' : 
                        this.phase === 2 ? '#604040' : '#802020';
        ctx.fillRect(screenX + 10, screenY40, 100, 100);
        
        // Head
        ctx.fillStyle = '#404040';
        ctx.fillRect(screenX + 25, screenY, 70, 50);
        
        // Evil eyes
        const eyeGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.fillStyle = this.phase === 3 ? `rgba(255, 0, 0, ${eyeGlow})` : 
                        this.phase === 2 ? `rgba(255, 128, 0, ${eyeGlow})` : 
                        `rgba(255, 0, 0, ${eyeGlow})`;
        ctx.fillRect(screenX + 35, screenY + 15, 20, 15);
        ctx.fillRect(screenX + 65, screenY + 15, 20, 15);
        
        // Angry eyebrow lines
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.moveTo(screenX + 30, screenY + 12);
        ctx.lineTo(screenX + 55, screenY + 18);
        ctx.lineTo(screenX + 55, screenY + 14);
        ctx.lineTo(screenX + 30, screenY + 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + 90, screenY + 12);
        ctx.lineTo(screenX + 65, screenY + 18);
        ctx.lineTo(screenX + 65, screenY + 14);
        ctx.lineTo(screenX + 90, screenY + 8);
        ctx.fill();
        
        // Mouth grill
        ctx.fillStyle = '#202020';
        ctx.fillRect(screenX + 35, screenY + 35, 50, 12);
        ctx.fillStyle = '#f00';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(screenX + 38 + i * 10, screenY + 37, 6, 8);
        }
        
        // Arms
        ctx.fillStyle = '#454545';
        ctx.fillRect(screenX - 10, screenY + 50, 25, 70);
        ctx.fillRect(screenX + 105, screenY + 50, 25, 70);
        
        // Claws
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 15, screenY + 115, 10, 25);
        ctx.fillRect(screenX + 5, screenY + 115, 10, 25);
        ctx.fillRect(screenX + 105, screenY + 115, 10, 25);
        ctx.fillRect(screenX + 125, screenY + 115, 10, 25);
        
        // Treads
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX, screenY + 140, 50, 25);
        ctx.fillRect(screenX + 70, screenY + 140, 50, 25);
        ctx.fillStyle = '#444';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(screenX + 5 + i * 15, screenY + 145, 10, 15);
            ctx.fillRect(screenX + 75 + i * 15, screenY + 145, 10, 15);
        }
        
        // MUSK logo
        ctx.fillStyle = '#0af';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('M', screenX + 60, screenY + 100);
        
        // Phase indicators (damage cracks)
        if (this.phase >= 2) {
            ctx.strokeStyle = '#800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX + 30, screenY + 60);
            ctx.lineTo(screenX + 50, screenY + 90);
            ctx.lineTo(screenX + 40, screenY + 120);
            ctx.stroke();
        }
        if (this.phase >= 3) {
            ctx.strokeStyle = '#a00';
            ctx.beginPath();
            ctx.moveTo(screenX + 90, screenY + 50);
            ctx.lineTo(screenX + 70, screenY + 85);
            ctx.lineTo(screenX + 85, screenY + 110);
            ctx.stroke();
            
            // Sparks
            if (Math.random() > 0.7) {
                ctx.fillStyle = '#ff0';
                ctx.fillRect(screenX + 70 + Math.random() * 20, screenY + 80 + Math.random() * 20, 4, 4);
            }
        }
        
        // Laser beam
        if (this.laserActive) {
            const laserStartX = screenX + 60;
            const laserStartY = screenY + 48;
            const laserLength = 800;
            
            ctx.save();
            ctx.translate(laserStartX, laserStartY);
            ctx.rotate(this.laserAngle + (this.facing < 0 ? Math.PI : 0));
            
            // Laser glow
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, -15, laserLength, 30);
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.fillRect(0, -8, laserLength, 16);
            ctx.fillStyle = '#f00';
            ctx.fillRect(0, -4, laserLength, 8);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, -2, laserLength, 4);
            
            ctx.restore();
        }
        
        // Health bar (large, top of screen)
        ctx.fillStyle = '#400';
        ctx.fillRect(screenX - 20, screenY - 30, 160, 16);
        ctx.fillStyle = this.phase === 1 ? '#f00' : 
                        this.phase === 2 ? '#f80' : '#f00';
        ctx.fillRect(screenX - 20, screenY - 30, 160 * (this.health / this.maxHealth), 16);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX - 20, screenY - 30, 160, 16);
        
        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLEANERBOT-X', screenX + 60, screenY - 35);
        
        ctx.restore();
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    laserCollidesWith(player, cameraX) {
        if (!this.laserActive) return false;
        
        // Simple laser collision check
        const laserY = this.y + 48 + Math.sin(this.laserAngle) * (player.x - this.x);
        return Math.abs(player.y + player.height/2 - laserY) < 20 &&
               ((this.facing < 0 && player.x < this.x) || (this.facing > 0 && player.x > this.x + this.width));
    }
}

// Fix Boss draw - define screenY
Boss.prototype.draw = function(ctx, cameraX) {
    if (!this.active) return;
    
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
    const screenX = this.x - cameraX + shakeX;
    const screenY = this.y;
    
    ctx.save();
    
    // Draw CLEANERBOT-X
    // Main body (large cleaning robot)
    ctx.fillStyle = this.phase === 1 ? '#505050' : 
                    this.phase === 2 ? '#604040' : '#802020';
    ctx.fillRect(screenX + 10, screenY + 40, 100, 100);
    
    // Head
    ctx.fillStyle = '#404040';
    ctx.fillRect(screenX + 25, screenY, 70, 50);
    
    // Evil eyes
    const eyeGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;
    ctx.fillStyle = this.phase === 3 ? `rgba(255, 0, 0, ${eyeGlow})` : 
                    this.phase === 2 ? `rgba(255, 128, 0, ${eyeGlow})` : 
                    `rgba(255, 0, 0, ${eyeGlow})`;
    ctx.fillRect(screenX + 35, screenY + 15, 20, 15);
    ctx.fillRect(screenX + 65, screenY + 15, 20, 15);
    
    // Angry eyebrow lines
    ctx.fillStyle = '#202020';
    ctx.beginPath();
    ctx.moveTo(screenX + 30, screenY + 12);
    ctx.lineTo(screenX + 55, screenY + 18);
    ctx.lineTo(screenX + 55, screenY + 14);
    ctx.lineTo(screenX + 30, screenY + 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(screenX + 90, screenY + 12);
    ctx.lineTo(screenX + 65, screenY + 18);
    ctx.lineTo(screenX + 65, screenY + 14);
    ctx.lineTo(screenX + 90, screenY + 8);
    ctx.fill();
    
    // Mouth grill
    ctx.fillStyle = '#202020';
    ctx.fillRect(screenX + 35, screenY + 35, 50, 12);
    ctx.fillStyle = '#f00';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(screenX + 38 + i * 10, screenY + 37, 6, 8);
    }
    
    // Arms
    ctx.fillStyle = '#454545';
    ctx.fillRect(screenX - 10, screenY + 50, 25, 70);
    ctx.fillRect(screenX + 105, screenY + 50, 25, 70);
    
    // Claws
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX - 15, screenY + 115, 10, 25);
    ctx.fillRect(screenX + 5, screenY + 115, 10, 25);
    ctx.fillRect(screenX + 105, screenY + 115, 10, 25);
    ctx.fillRect(screenX + 125, screenY + 115, 10, 25);
    
    // Treads
    ctx.fillStyle = '#222';
    ctx.fillRect(screenX, screenY + 140, 50, 25);
    ctx.fillRect(screenX + 70, screenY + 140, 50, 25);
    ctx.fillStyle = '#444';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(screenX + 5 + i * 15, screenY + 145, 10, 15);
        ctx.fillRect(screenX + 75 + i * 15, screenY + 145, 10, 15);
    }
    
    // MUSK logo
    ctx.fillStyle = '#0af';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('M', screenX + 60, screenY + 100);
    
    // Phase indicators (damage cracks)
    if (this.phase >= 2) {
        ctx.strokeStyle = '#800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX + 30, screenY + 60);
        ctx.lineTo(screenX + 50, screenY + 90);
        ctx.lineTo(screenX + 40, screenY + 120);
        ctx.stroke();
    }
    if (this.phase >= 3) {
        ctx.strokeStyle = '#a00';
        ctx.beginPath();
        ctx.moveTo(screenX + 90, screenY + 50);
        ctx.lineTo(screenX + 70, screenY + 85);
        ctx.lineTo(screenX + 85, screenY + 110);
        ctx.stroke();
        
        // Sparks
        if (Math.random() > 0.7) {
            ctx.fillStyle = '#ff0';
            ctx.fillRect(screenX + 70 + Math.random() * 20, screenY + 80 + Math.random() * 20, 4, 4);
        }
    }
    
    // Laser beam
    if (this.laserActive) {
        const laserStartX = screenX + 60;
        const laserStartY = screenY + 48;
        const laserLength = 800;
        
        ctx.save();
        ctx.translate(laserStartX, laserStartY);
        ctx.rotate(this.laserAngle + (this.facing < 0 ? Math.PI : 0));
        
        // Laser glow
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, -15, laserLength, 30);
        ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.fillRect(0, -8, laserLength, 16);
        ctx.fillStyle = '#f00';
        ctx.fillRect(0, -4, laserLength, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -2, laserLength, 4);
        
        ctx.restore();
    }
    
    // Health bar (large, at top of boss)
    ctx.fillStyle = '#400';
    ctx.fillRect(screenX - 20, screenY - 30, 160, 16);
    ctx.fillStyle = this.phase === 1 ? '#f00' : 
                    this.phase === 2 ? '#f80' : '#f00';
    ctx.fillRect(screenX - 20, screenY - 30, 160 * (this.health / this.maxHealth), 16);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 20, screenY - 30, 160, 16);
    
    // Boss name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLEANERBOT-X', screenX + 60, screenY - 35);
    
    ctx.restore();
};

// Stage 1 Level Design - Extended Version
function createStage1() {
    const platforms = [];
    const enemies = [];
    const pickups = [];
    
    // ============ SECTION 1: Starting Area (0-1500) ============
    // Ground level
    platforms.push(new Platform(0, 560, 800, 80, 'ground'));
    platforms.push(new Platform(900, 560, 600, 80, 'ground'));
    
    // Starting building (left wall)
    platforms.push(new Platform(-50, 200, 100, 360, 'building'));
    
    // Debris piles from rocket explosion
    platforms.push(new Platform(400, 520, 80, 40, 'debris'));
    
    // Floating platforms - easy introduction
    platforms.push(new Platform(550, 460, 120, 24, 'platform'));
    platforms.push(new Platform(720, 400, 100, 24, 'platform'));
    platforms.push(new Platform(900, 340, 140, 24, 'platform'));
    platforms.push(new Platform(1100, 400, 120, 24, 'platform'));
    platforms.push(new Platform(1300, 460, 100, 24, 'platform'));
    
    // Early enemies (easy)
    enemies.push(new Enemy(500, 512, 'robot'));
    enemies.push(new Enemy(1000, 512, 'robot'));
    enemies.push(new Enemy(800, 300, 'drone'));
    
    // Early pickups
    pickups.push(new Pickup(570, 430, 'ammo'));
    pickups.push(new Pickup(920, 310, 'health'));
    
    // ============ SECTION 2: First Challenge (1500-3000) ============
    // Ground with gaps
    platforms.push(new Platform(1600, 560, 400, 80, 'ground'));
    platforms.push(new Platform(2100, 560, 500, 80, 'ground'));
    platforms.push(new Platform(2700, 560, 400, 80, 'ground'));
    
    // Small shed - easy to jump over (lowered from original building)
    platforms.push(new Platform(1800, 450, 80, 110, 'debris'));
    
    // Stepping platforms around the shed
    platforms.push(new Platform(1700, 500, 80, 24, 'platform'));
    platforms.push(new Platform(1900, 480, 100, 24, 'platform'));
    
    // More platforms for navigation
    platforms.push(new Platform(2000, 400, 120, 24, 'platform'));
    platforms.push(new Platform(2200, 450, 100, 24, 'platform'));
    platforms.push(new Platform(2400, 380, 120, 24, 'platform'));
    platforms.push(new Platform(2600, 440, 100, 24, 'platform'));
    platforms.push(new Platform(2850, 380, 120, 24, 'platform'));
    
    // SHOTGUN - placed on accessible platform with clear path
    pickups.push(new Pickup(2020, 370, 'shotgun'));
    
    // Debris pile
    platforms.push(new Platform(2300, 500, 100, 60, 'debris'));
    
    // Section 2 enemies
    enemies.push(new Enemy(1650, 512, 'robot'));
    enemies.push(new Enemy(2200, 512, 'robot'));
    enemies.push(new Enemy(2500, 512, 'robot'));
    enemies.push(new Enemy(1900, 350, 'drone'));
    enemies.push(new Enemy(2600, 300, 'drone'));
    enemies.push(new Enemy(2800, 524, 'car'));
    
    // Turret on debris
    enemies.push(new Enemy(2280, 440, 'turret'));
    
    // Section 2 pickups
    pickups.push(new Pickup(2220, 420, 'ammo'));
    pickups.push(new Pickup(2420, 350, 'health'));
    pickups.push(new Pickup(2870, 350, 'ammo'));
    
    // ============ SECTION 3: Industrial Zone (3000-4500) ============
    // Ground
    platforms.push(new Platform(3200, 560, 600, 80, 'ground'));
    platforms.push(new Platform(3900, 560, 700, 80, 'ground'));
    
    // Industrial buildings (with stepping stones for accessibility)
    platforms.push(new Platform(3400, 400, 100, 160, 'building'));
    platforms.push(new Platform(3300, 480, 80, 24, 'platform')); // Step to building
    platforms.push(new Platform(3520, 450, 80, 24, 'platform')); // Step down
    
    // Overhead platforms
    platforms.push(new Platform(3600, 350, 120, 24, 'platform'));
    platforms.push(new Platform(3800, 280, 100, 24, 'platform'));
    platforms.push(new Platform(4000, 350, 140, 24, 'platform'));
    platforms.push(new Platform(4200, 420, 120, 24, 'platform'));
    platforms.push(new Platform(4400, 350, 100, 24, 'platform'));
    
    // Large debris pile
    platforms.push(new Platform(4100, 480, 150, 80, 'debris'));
    
    // Section 3 enemies
    enemies.push(new Enemy(3300, 512, 'robot'));
    enemies.push(new Enemy(3600, 512, 'robot'));
    enemies.push(new Enemy(4000, 512, 'robot'));
    enemies.push(new Enemy(4300, 512, 'robot'));
    enemies.push(new Enemy(3500, 300, 'drone'));
    enemies.push(new Enemy(4100, 280, 'drone'));
    enemies.push(new Enemy(4400, 524, 'car'));
    enemies.push(new Enemy(3380, 368, 'turret')); // On building
    
    // Section 3 pickups
    pickups.push(new Pickup(3620, 320, 'ammo'));
    pickups.push(new Pickup(3820, 250, 'health'));
    pickups.push(new Pickup(4020, 320, 'ammo'));
    pickups.push(new Pickup(4220, 390, 'health'));
    
    // ============ SECTION 4: Danger Zone (4500-6000) ============
    // Broken highway
    platforms.push(new Platform(4700, 560, 500, 80, 'ground'));
    platforms.push(new Platform(5300, 560, 400, 80, 'ground'));
    platforms.push(new Platform(5800, 560, 400, 80, 'ground'));
    
    // Elevated highway section
    platforms.push(new Platform(4800, 400, 200, 24, 'platform'));
    platforms.push(new Platform(5100, 350, 150, 24, 'platform'));
    platforms.push(new Platform(5350, 400, 120, 24, 'platform'));
    platforms.push(new Platform(5550, 320, 100, 24, 'platform'));
    platforms.push(new Platform(5750, 380, 140, 24, 'platform'));
    
    // Danger zone debris
    platforms.push(new Platform(5000, 500, 100, 60, 'debris'));
    platforms.push(new Platform(5500, 480, 120, 80, 'debris'));
    
    // Section 4 enemies - more challenging
    enemies.push(new Enemy(4800, 512, 'robot'));
    enemies.push(new Enemy(5200, 512, 'robot'));
    enemies.push(new Enemy(5600, 512, 'robot'));
    enemies.push(new Enemy(4900, 300, 'drone'));
    enemies.push(new Enemy(5400, 280, 'drone'));
    enemies.push(new Enemy(5800, 320, 'drone'));
    enemies.push(new Enemy(5100, 524, 'car'));
    enemies.push(new Enemy(5700, 524, 'car'));
    enemies.push(new Enemy(5480, 400, 'turret'));
    
    // Section 4 pickups
    pickups.push(new Pickup(4820, 370, 'ammo'));
    pickups.push(new Pickup(5120, 320, 'health'));
    pickups.push(new Pickup(5370, 370, 'ammo'));
    pickups.push(new Pickup(5570, 290, 'shotgun'));
    pickups.push(new Pickup(5770, 350, 'health'));
    
    // ============ SECTION 5: Musk Tower Approach (6000-7500) ============
    // Final stretch of ground
    platforms.push(new Platform(6300, 560, 600, 80, 'ground'));
    platforms.push(new Platform(7000, 560, 600, 80, 'ground'));
    
    // Tower approach buildings
    platforms.push(new Platform(6200, 350, 80, 210, 'building'));
    platforms.push(new Platform(6100, 450, 80, 24, 'platform')); // Step
    platforms.push(new Platform(6300, 400, 80, 24, 'platform')); // Step
    
    platforms.push(new Platform(6700, 380, 100, 180, 'building'));
    platforms.push(new Platform(6600, 480, 80, 24, 'platform')); // Step
    platforms.push(new Platform(6820, 430, 80, 24, 'platform')); // Step
    
    // Elevated path
    platforms.push(new Platform(6400, 320, 120, 24, 'platform'));
    platforms.push(new Platform(6550, 380, 100, 24, 'platform'));
    platforms.push(new Platform(6900, 320, 120, 24, 'platform'));
    platforms.push(new Platform(7100, 380, 100, 24, 'platform'));
    platforms.push(new Platform(7300, 300, 140, 24, 'platform'));
    platforms.push(new Platform(7500, 380, 100, 24, 'platform'));
    
    // Large debris field
    platforms.push(new Platform(7200, 480, 200, 80, 'debris'));
    
    // Section 5 enemies - heavy resistance
    enemies.push(new Enemy(6400, 512, 'robot'));
    enemies.push(new Enemy(6700, 512, 'robot'));
    enemies.push(new Enemy(7000, 512, 'robot'));
    enemies.push(new Enemy(7300, 512, 'robot'));
    enemies.push(new Enemy(6300, 280, 'drone'));
    enemies.push(new Enemy(6800, 300, 'drone'));
    enemies.push(new Enemy(7200, 280, 'drone'));
    enemies.push(new Enemy(6500, 524, 'car'));
    enemies.push(new Enemy(7100, 524, 'car'));
    enemies.push(new Enemy(6180, 318, 'turret')); // On building
    enemies.push(new Enemy(6680, 348, 'turret')); // On building
    
    // Section 5 pickups
    pickups.push(new Pickup(6420, 290, 'ammo'));
    pickups.push(new Pickup(6570, 350, 'health'));
    pickups.push(new Pickup(6920, 290, 'health'));
    pickups.push(new Pickup(7120, 350, 'ammo'));
    pickups.push(new Pickup(7320, 270, 'shotgun'));
    pickups.push(new Pickup(7520, 350, 'health'));
    
    // ============ SECTION 6: Pre-Boss Area (7500-8500) ============
    // Final ground before arena
    platforms.push(new Platform(7700, 560, 500, 80, 'ground'));
    platforms.push(new Platform(8300, 560, 300, 80, 'ground'));
    
    // Final challenge platforms
    platforms.push(new Platform(7800, 420, 120, 24, 'platform'));
    platforms.push(new Platform(8000, 350, 100, 24, 'platform'));
    platforms.push(new Platform(8200, 420, 140, 24, 'platform'));
    platforms.push(new Platform(8400, 350, 100, 24, 'platform'));
    
    // Debris
    platforms.push(new Platform(7900, 500, 100, 60, 'debris'));
    
    // Final wave of enemies
    enemies.push(new Enemy(7800, 512, 'robot'));
    enemies.push(new Enemy(8100, 512, 'robot'));
    enemies.push(new Enemy(8400, 512, 'robot'));
    enemies.push(new Enemy(7900, 300, 'drone'));
    enemies.push(new Enemy(8300, 280, 'drone'));
    enemies.push(new Enemy(8000, 524, 'car'));
    enemies.push(new Enemy(8180, 388, 'turret'));
    
    // Final pickups before boss
    pickups.push(new Pickup(7820, 390, 'ammo'));
    pickups.push(new Pickup(8020, 320, 'health'));
    pickups.push(new Pickup(8220, 390, 'ammo'));
    pickups.push(new Pickup(8420, 320, 'health'));
    
    // ============ BOSS ARENA (8600-9600) ============
    // Extended ground for boss fight
    platforms.push(new Platform(8600, 560, 1000, 80, 'ground'));
    
    // Arena walls
    platforms.push(new Platform(8550, 300, 50, 260, 'building'));
    platforms.push(new Platform(9550, 300, 100, 260, 'building'));
    
    // Arena platforms for dodging
    platforms.push(new Platform(8700, 450, 100, 24, 'platform'));
    platforms.push(new Platform(8900, 380, 120, 24, 'platform'));
    platforms.push(new Platform(9100, 450, 100, 24, 'platform'));
    platforms.push(new Platform(9300, 380, 120, 24, 'platform'));
    platforms.push(new Platform(9000, 300, 80, 24, 'platform'));
    
    // Health and ammo for boss fight
    pickups.push(new Pickup(8720, 420, 'health'));
    pickups.push(new Pickup(8920, 350, 'shotgun'));
    pickups.push(new Pickup(9120, 420, 'ammo'));
    pickups.push(new Pickup(9320, 350, 'health'));
    pickups.push(new Pickup(9020, 270, 'ammo'));
    
    // THE BOSS
    const boss = new Boss(9300, 400);
    
    return { platforms, enemies, pickups, boss, levelWidth: 9650 };
}

// Game instance variables
let player = new Player();
let bullets = [];
let enemyBullets = [];
let level = createStage1();
let keys = {};

// Explosions for visual effects
let explosions = [];

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.maxFrames = 15;
    }
    
    update() {
        this.frame++;
        return this.frame < this.maxFrames;
    }
    
    draw(ctx, cameraX) {
        const progress = this.frame / this.maxFrames;
        const radius = 20 + progress * 30;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Outer explosion
        ctx.fillStyle = '#f80';
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner explosion
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Draw background
function drawBackground(ctx, cameraX) {
    // Sky gradient (polluted LA sky)
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.5, '#4a2040');
    gradient.addColorStop(1, '#6a3030');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Smoke/pollution clouds
    ctx.fillStyle = 'rgba(50, 30, 30, 0.5)';
    for (let i = 0; i < 10; i++) {
        const cloudX = ((i * 200 - cameraX * 0.1) % (GAME_WIDTH + 200)) - 100;
        const cloudY = 50 + Math.sin(i * 1.5) * 40;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 60 + i * 10, 0, Math.PI * 2);
        ctx.arc(cloudX + 40, cloudY + 10, 50 + i * 8, 0, Math.PI * 2);
        ctx.arc(cloudX - 30, cloudY + 15, 40 + i * 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Distant burning buildings (parallax)
    ctx.fillStyle = '#2a1a1a';
    for (let i = 0; i < 15; i++) {
        const buildingX = (i * 150 - cameraX * 0.2) % (GAME_WIDTH + 300) - 150;
        const buildingHeight = 100 + Math.sin(i * 2) * 80;
        ctx.fillRect(buildingX, GAME_HEIGHT - buildingHeight - 100, 80, buildingHeight);
        
        // Fires
        if (i % 3 === 0) {
            ctx.fillStyle = '#f80';
            ctx.fillRect(buildingX + 20, GAME_HEIGHT - buildingHeight - 100, 20, 15);
            ctx.fillStyle = '#ff0';
            ctx.fillRect(buildingX + 25, GAME_HEIGHT - buildingHeight - 95, 10, 10);
            ctx.fillStyle = '#2a1a1a';
        }
    }
    
    // Mid-ground ruined buildings
    ctx.fillStyle = '#3a2a2a';
    for (let i = 0; i < 12; i++) {
        const buildingX = (i * 180 - cameraX * 0.4) % (GAME_WIDTH + 400) - 200;
        const buildingHeight = 150 + Math.sin(i * 3) * 100;
        ctx.fillRect(buildingX, GAME_HEIGHT - buildingHeight - 80, 100, buildingHeight);
        
        // Windows (some broken)
        ctx.fillStyle = '#1a1a1a';
        for (let wy = 20; wy < buildingHeight - 20; wy += 40) {
            for (let wx = 15; wx < 85; wx += 35) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(buildingX + wx, GAME_HEIGHT - buildingHeight - 80 + wy, 20, 25);
                }
            }
        }
        ctx.fillStyle = '#3a2a2a';
    }
    
    // Rocket debris in sky
    ctx.fillStyle = '#555';
    const debrisX = (200 - cameraX * 0.05) % GAME_WIDTH;
    ctx.save();
    ctx.translate(debrisX + 100, 120);
    ctx.rotate(0.3);
    ctx.fillRect(-60, -15, 120, 30);
    ctx.fillStyle = '#666';
    ctx.fillRect(-40, -10, 80, 20);
    // Fire trail
    ctx.fillStyle = '#f80';
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(-100, -20);
    ctx.lineTo(-90, 0);
    ctx.lineTo(-100, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Ground haze
    ctx.fillStyle = 'rgba(100, 50, 50, 0.3)';
    ctx.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 120);
}

// Draw title screen
function drawTitleScreen(ctx) {
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Animated flames
    for (let i = 0; i < 20; i++) {
        const flameX = (i * 60) % GAME_WIDTH;
        const flameHeight = 50 + Math.sin(Date.now() / 200 + i) * 30;
        const gradient = ctx.createLinearGradient(flameX, GAME_HEIGHT, flameX, GAME_HEIGHT - flameHeight);
        gradient.addColorStop(0, '#f00');
        gradient.addColorStop(0.5, '#f80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(flameX - 15, GAME_HEIGHT - flameHeight, 30, flameHeight);
    }
    
    // Title
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MAD MUSK', GAME_WIDTH/2, 200);
    
    // Subtitle
    ctx.fillStyle = '#ff0';
    ctx.font = '24px monospace';
    ctx.fillText('REVENGE OF LUKE NEWCOMB', GAME_WIDTH/2, 250);
    
    // Stage info
    ctx.fillStyle = '#fff';
    ctx.font = '32px monospace';
    ctx.fillText('STAGE 1: REVENGE BEGINS', GAME_WIDTH/2, 350);
    
    // Flickering "Press Enter"
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#0f0';
        ctx.font = '24px monospace';
        ctx.fillText('PRESS ENTER TO START', GAME_WIDTH/2, 500);
    }
    
    // Credits
    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.fillText('A DUKE NUKEM STYLE ADVENTURE', GAME_WIDTH/2, 580);
    
    ctx.textAlign = 'left';
}

// Draw story artwork (Duke Nukem style pixel art)
function drawStoryArt(ctx, page) {
    const centerX = GAME_WIDTH / 2;
    const artY = 180;
    
    ctx.save();
    
    switch(page) {
        case 0: // Neon Musk as a hero
            // Starry sky background
            ctx.fillStyle = '#0a0a2a';
            ctx.fillRect(centerX - 180, artY, 360, 200);
            
            // Stars
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 30; i++) {
                ctx.fillRect(centerX - 170 + (i * 37) % 340, artY + 10 + (i * 23) % 80, 2, 2);
            }
            
            // City skyline (beautiful)
            ctx.fillStyle = '#1a3a5a';
            ctx.fillRect(centerX - 160, artY + 100, 60, 100);
            ctx.fillRect(centerX - 90, artY + 120, 50, 80);
            ctx.fillRect(centerX - 30, artY + 80, 70, 120);
            ctx.fillRect(centerX + 50, artY + 110, 55, 90);
            ctx.fillRect(centerX + 115, artY + 90, 45, 110);
            
            // Lit windows (happy city)
            ctx.fillStyle = '#ffa';
            for (let b = 0; b < 5; b++) {
                for (let w = 0; w < 3; w++) {
                    ctx.fillRect(centerX - 150 + b * 65 + w * 12, artY + 130 + (b % 3) * 15, 8, 10);
                }
            }
            
            // Musk figure (heroic pose) - center
            // Body
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(centerX - 25, artY + 80, 50, 70);
            
            // Head
            ctx.fillStyle = '#deb887';
            ctx.fillRect(centerX - 15, artY + 50, 30, 35);
            
            // Hair
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(centerX - 15, artY + 48, 30, 10);
            
            // Smile
            ctx.fillStyle = '#fff';
            ctx.fillRect(centerX - 8, artY + 72, 16, 4);
            
            // Eyes (kind)
            ctx.fillStyle = '#4a4a8a';
            ctx.fillRect(centerX - 10, artY + 60, 6, 6);
            ctx.fillRect(centerX + 4, artY + 60, 6, 6);
            
            // Arms raised triumphantly
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(centerX - 45, artY + 60, 20, 12);
            ctx.fillRect(centerX + 25, artY + 60, 20, 12);
            
            // Hands
            ctx.fillStyle = '#deb887';
            ctx.fillRect(centerX - 50, artY + 55, 12, 12);
            ctx.fillRect(centerX + 38, artY + 55, 12, 12);
            
            // Robot helper beside him
            ctx.fillStyle = '#6a6a8a';
            ctx.fillRect(centerX + 80, artY + 110, 30, 40);
            ctx.fillStyle = '#8a8aaa';
            ctx.fillRect(centerX + 85, artY + 100, 20, 15);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(centerX + 88, artY + 105, 5, 5);
            ctx.fillRect(centerX + 97, artY + 105, 5, 5);
            
            // Tree (planted by robots)
            ctx.fillStyle = '#4a2a1a';
            ctx.fillRect(centerX - 120, artY + 130, 12, 30);
            ctx.fillStyle = '#2a6a2a';
            ctx.beginPath();
            ctx.arc(centerX - 114, artY + 115, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Electric car
            ctx.fillStyle = '#3a5a7a';
            ctx.fillRect(centerX - 80, artY + 155, 45, 20);
            ctx.fillStyle = '#7af';
            ctx.fillRect(centerX - 70, artY + 150, 25, 10);
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(centerX - 70, artY + 175, 8, 0, Math.PI * 2);
            ctx.arc(centerX - 45, artY + 175, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // "MUSK INDUSTRIES" text
            ctx.fillStyle = '#0af';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MUSK INDUSTRIES', centerX, artY + 195);
            break;
            
        case 1: // The Fall - Musk's corruption
            // Dark red background
            ctx.fillStyle = '#1a0a0a';
            ctx.fillRect(centerX - 180, artY, 360, 200);
            
            // Laboratory setting
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(centerX - 160, artY + 140, 320, 60);
            
            // Medical equipment
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(centerX - 140, artY + 100, 40, 60);
            ctx.fillRect(centerX + 100, artY + 100, 40, 60);
            
            // Screens with brain scans
            ctx.fillStyle = '#300';
            ctx.fillRect(centerX - 135, artY + 105, 30, 25);
            ctx.fillStyle = '#f00';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ERROR', centerX - 120, artY + 122);
            
            // Musk on operating table
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(centerX - 60, artY + 130, 120, 20);
            
            // Body (lying down)
            ctx.fillStyle = '#2a2a4a';
            ctx.fillRect(centerX - 40, artY + 115, 80, 20);
            
            // Head with device
            ctx.fillStyle = '#deb887';
            ctx.fillRect(centerX - 55, artY + 118, 20, 15);
            
            // Brain device (sparking!)
            ctx.fillStyle = '#666';
            ctx.fillRect(centerX - 60, artY + 110, 30, 10);
            
            // Sparks/electricity
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX - 45 + i * 5, artY + 105);
                ctx.lineTo(centerX - 48 + i * 5, artY + 95 - Math.random() * 20);
                ctx.lineTo(centerX - 42 + i * 5, artY + 85 - Math.random() * 15);
                ctx.stroke();
            }
            
            // Warning signs
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('⚠ CRITICAL FAILURE ⚠', centerX, artY + 40);
            
            // Corrupted eyes (showing transformation)
            ctx.fillStyle = '#f00';
            ctx.fillRect(centerX - 52, artY + 122, 4, 4);
            ctx.fillRect(centerX - 44, artY + 122, 4, 4);
            
            // Dark aura around him
            ctx.strokeStyle = '#600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, artY + 125, 80, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
        case 2: // The Tragedy - Rocket explosion
            // Orange/red explosion sky
            const gradient = ctx.createLinearGradient(centerX - 180, artY, centerX - 180, artY + 200);
            gradient.addColorStop(0, '#f80');
            gradient.addColorStop(0.5, '#a30');
            gradient.addColorStop(1, '#300');
            ctx.fillStyle = gradient;
            ctx.fillRect(centerX - 180, artY, 360, 200);
            
            // Exploding rocket debris
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(centerX, artY + 50, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(centerX, artY + 50, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.arc(centerX, artY + 50, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Debris flying
            ctx.fillStyle = '#555';
            ctx.save();
            ctx.translate(centerX - 60, artY + 80);
            ctx.rotate(-0.5);
            ctx.fillRect(0, 0, 40, 15);
            ctx.restore();
            ctx.save();
            ctx.translate(centerX + 40, artY + 90);
            ctx.rotate(0.4);
            ctx.fillRect(0, 0, 35, 12);
            ctx.restore();
            
            // Falling engine piece (the one that kills the family)
            ctx.fillStyle = '#444';
            ctx.save();
            ctx.translate(centerX - 20, artY + 130);
            ctx.rotate(0.3);
            ctx.fillRect(0, 0, 50, 25);
            ctx.fillStyle = '#f80';
            ctx.fillRect(45, 5, 20, 15);
            ctx.restore();
            
            // Street below
            ctx.fillStyle = '#333';
            ctx.fillRect(centerX - 180, artY + 170, 360, 30);
            
            // The car (Sarah and Tommy inside)
            ctx.fillStyle = '#2a4a2a';
            ctx.fillRect(centerX - 40, artY + 155, 60, 25);
            ctx.fillStyle = '#6af';
            ctx.fillRect(centerX - 30, artY + 150, 40, 12);
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(centerX - 25, artY + 180, 8, 0, Math.PI * 2);
            ctx.arc(centerX + 5, artY + 180, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // School in background
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(centerX + 80, artY + 130, 80, 45);
            ctx.fillStyle = '#6a5a4a';
            ctx.fillRect(centerX + 90, artY + 120, 60, 15);
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.fillText('SCHOOL', centerX + 120, artY + 145);
            
            // Impact lines
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX, artY + 50);
                ctx.lineTo(centerX + Math.cos(i * 0.8) * 100, artY + 50 + Math.sin(i * 0.8) * 80);
                ctx.stroke();
            }
            break;
            
        case 3: // Luke Newcomb - The hero rises
            // Dark city background
            ctx.fillStyle = '#0a0a15';
            ctx.fillRect(centerX - 180, artY, 360, 200);
            
            // Ruined city silhouette
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(centerX - 160, artY + 120, 50, 80);
            ctx.fillRect(centerX - 100, artY + 100, 40, 100);
            ctx.fillRect(centerX + 60, artY + 110, 60, 90);
            ctx.fillRect(centerX + 130, artY + 130, 40, 70);
            
            // Fires in buildings
            ctx.fillStyle = '#f60';
            ctx.fillRect(centerX - 150, artY + 130, 15, 20);
            ctx.fillRect(centerX + 80, artY + 125, 12, 15);
            
            // Luke Newcomb - large portrait (Duke Nukem style)
            // Background glow
            ctx.fillStyle = '#330';
            ctx.beginPath();
            ctx.arc(centerX - 50, artY + 100, 80, 0, Math.PI * 2);
            ctx.fill();
            
            // Muscular body
            ctx.fillStyle = '#5a3a1a'; // Brown leather jacket
            ctx.fillRect(centerX - 90, artY + 70, 80, 90);
            
            // Chest/shirt
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(centerX - 80, artY + 75, 60, 40);
            
            // Neck
            ctx.fillStyle = '#deb887';
            ctx.fillRect(centerX - 60, artY + 55, 20, 20);
            
            // Head (larger, more detailed)
            ctx.fillStyle = '#deb887';
            ctx.fillRect(centerX - 75, artY + 15, 50, 45);
            
            // Hair (dark, messy from grief)
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(centerX - 78, artY + 10, 56, 15);
            ctx.fillRect(centerX - 78, artY + 15, 8, 10);
            ctx.fillRect(centerX - 25, artY + 15, 8, 10);
            
            // Eyes (intense, angry)
            ctx.fillStyle = '#fff';
            ctx.fillRect(centerX - 68, artY + 30, 14, 8);
            ctx.fillRect(centerX - 46, artY + 30, 14, 8);
            ctx.fillStyle = '#26a';
            ctx.fillRect(centerX - 65, artY + 31, 8, 6);
            ctx.fillRect(centerX - 43, artY + 31, 8, 6);
            ctx.fillStyle = '#000';
            ctx.fillRect(centerX - 63, artY + 32, 4, 4);
            ctx.fillRect(centerX - 41, artY + 32, 4, 4);
            
            // Angry eyebrows
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(centerX - 70, artY + 26, 16, 4);
            ctx.fillRect(centerX - 48, artY + 26, 16, 4);
            
            // Stubble/5 o'clock shadow
            ctx.fillStyle = '#8a7a6a';
            ctx.fillRect(centerX - 70, artY + 45, 40, 12);
            
            // Grimacing mouth
            ctx.fillStyle = '#000';
            ctx.fillRect(centerX - 62, artY + 50, 24, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(centerX - 60, artY + 50, 4, 3);
            ctx.fillRect(centerX - 52, artY + 50, 4, 3);
            ctx.fillRect(centerX - 44, artY + 50, 4, 3);
            
            // Arms (one holding gun)
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(centerX - 95, artY + 80, 15, 50);
            ctx.fillRect(centerX - 15, artY + 80, 15, 50);
            
            // Hands
            ctx.fillStyle = '#deb887';
            ctx.fillRect(centerX - 93, artY + 125, 12, 15);
            ctx.fillRect(centerX - 13, artY + 125, 12, 15);
            
            // BIG GUN
            ctx.fillStyle = '#333';
            ctx.fillRect(centerX - 10, artY + 100, 100, 25);
            ctx.fillStyle = '#444';
            ctx.fillRect(centerX - 10, artY + 105, 80, 15);
            ctx.fillRect(centerX + 70, artY + 95, 30, 35);
            
            // Gun details
            ctx.fillStyle = '#222';
            ctx.fillRect(centerX, artY + 108, 60, 8);
            ctx.fillStyle = '#555';
            ctx.fillRect(centerX + 75, artY + 100, 8, 6);
            
            // Muzzle
            ctx.fillStyle = '#111';
            ctx.fillRect(centerX + 85, artY + 105, 15, 15);
            
            // Quote
            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('"TIME TO PAY, MUSK."', centerX, artY + 190);
            break;
    }
    
    // Border around artwork
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - 180, artY, 360, 200);
    
    ctx.restore();
}

// Draw intro/story screens
function drawIntroScreen(ctx, page) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Border
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, GAME_WIDTH - 100, GAME_HEIGHT - 100);
    
    const story = storyPages[page];
    
    // Title at top
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(story.title, GAME_WIDTH/2, 100);
    
    // Draw the artwork
    drawStoryArt(ctx, page);
    
    // Text below artwork
    ctx.fillStyle = '#ccc';
    ctx.font = '18px monospace';
    let y = 410;
    for (let line of story.text) {
        if (line.includes('[PRESS')) {
            ctx.fillStyle = '#0f0';
            y += 10;
        }
        ctx.fillText(line, GAME_WIDTH/2, y);
        y += 26;
        ctx.fillStyle = '#ccc';
    }
    
    // Page indicator
    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.fillText(`${page + 1} / ${storyPages.length}`, GAME_WIDTH/2, GAME_HEIGHT - 70);
    
    ctx.textAlign = 'left';
}

// Draw game over screen
function drawGameOverScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH/2, GAME_HEIGHT/2 - 50);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`FINAL SCORE: ${score}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 20);
    
    ctx.fillStyle = '#ff0';
    ctx.fillText('MUSK WINS... FOR NOW', GAME_WIDTH/2, GAME_HEIGHT/2 + 70);
    
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#0f0';
        ctx.fillText('PRESS ENTER TO RETRY', GAME_WIDTH/2, GAME_HEIGHT/2 + 140);
    }
    
    ctx.textAlign = 'left';
}

// Draw stage complete screen
function drawStageCompleteScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE 1 COMPLETE!', GAME_WIDTH/2, GAME_HEIGHT/2 - 120);
    
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CLEANERBOT-X DESTROYED!', GAME_WIDTH/2, GAME_HEIGHT/2 - 70);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`FINAL SCORE: ${score}`, GAME_WIDTH/2, GAME_HEIGHT/2 - 20);
    
    ctx.fillStyle = '#ff0';
    ctx.font = '18px monospace';
    ctx.fillText('"That was just a cleaning bot..."', GAME_WIDTH/2, GAME_HEIGHT/2 + 40);
    ctx.fillText('"Musk has far worse waiting in his tower."', GAME_WIDTH/2, GAME_HEIGHT/2 + 65);
    ctx.fillText('"Time to take out the trash."', GAME_WIDTH/2, GAME_HEIGHT/2 + 90);
    
    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('Luke advances toward Musk Tower...', GAME_WIDTH/2, GAME_HEIGHT/2 + 140);
    
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('TO BE CONTINUED IN STAGE 2...', GAME_WIDTH/2, GAME_HEIGHT/2 + 200);
    }
    
    ctx.textAlign = 'left';
}

// Draw HUD
function drawHUD(ctx) {
    document.getElementById('health').textContent = `HEALTH: ${player.health}`;
    document.getElementById('ammo').textContent = `AMMO: ${player.ammo}`;
    document.getElementById('score').textContent = `SCORE: ${score}`;
    
    // Draw shotgun ammo on screen if player has any
    if (shotgunAmmo > 0) {
        ctx.fillStyle = '#f80';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SHOTGUN: ${shotgunAmmo}`, 10, 90);
    }
    
    // Draw weapon indicator
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('[Z] Shotgun  [X/CTRL] Pistol  [ESC] Pause  [M] Music: ' + (musicMuted ? 'OFF' : 'ON'), 10, 110);
    
    // Boss health bar at top of screen
    if (level.boss && level.boss.active) {
        const barWidth = 400;
        const barX = (GAME_WIDTH - barWidth) / 2;
        
        ctx.fillStyle = '#400';
        ctx.fillRect(barX, 20, barWidth, 24);
        ctx.fillStyle = level.boss.phase === 3 ? '#f00' : 
                        level.boss.phase === 2 ? '#f80' : '#f00';
        ctx.fillRect(barX, 20, barWidth * (level.boss.health / level.boss.maxHealth), 24);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, 20, barWidth, 24);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLEANERBOT-X', GAME_WIDTH / 2, 16);
        ctx.textAlign = 'left';
    }
}

// Draw pause screen
function drawPauseScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH/2, GAME_HEIGHT/2 - 50);
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Press ENTER or ESC to continue', GAME_WIDTH/2, GAME_HEIGHT/2 + 20);
    
    // Controls reminder
    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('Controls:', GAME_WIDTH/2, GAME_HEIGHT/2 + 80);
    ctx.fillText('ARROWS/WASD - Move & Jump', GAME_WIDTH/2, GAME_HEIGHT/2 + 110);
    ctx.fillText('X or CTRL - Shoot Pistol', GAME_WIDTH/2, GAME_HEIGHT/2 + 135);
    ctx.fillText('Z - Shoot Shotgun', GAME_WIDTH/2, GAME_HEIGHT/2 + 160);
    
    ctx.textAlign = 'left';
}

// Main update function
function update() {
    if (gameState !== GameState.PLAYING) return;
    
    // Update screen shake
    screenShake.update();
    
    // Update particles
    particles = particles.filter(p => p.update());
    
    // Update player
    player.update(keys, level.platforms, level.enemies);
    
    // Camera follow
    const targetCameraX = player.x - GAME_WIDTH / 3;
    cameraX += (targetCameraX - cameraX) * 0.1;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > level.levelWidth - GAME_WIDTH) cameraX = level.levelWidth - GAME_WIDTH;
    
    // Update bullets
    for (let bullet of bullets) {
        bullet.update();
        
        // Check enemy collisions
        for (let enemy of level.enemies) {
            if (enemy.active && bullet.collidesWith(enemy)) {
                const damage = bullet.damage || 10;
                enemy.health -= damage;
                bullet.active = false;
                spawnParticles(bullet.x, bullet.y, 5, ['#ff0', '#f80']);
                
                if (enemy.health <= 0) {
                    enemy.active = false;
                    score += enemy.points;
                    explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
                    spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 15, ['#f00', '#f80', '#ff0']);
                    AudioSystem.play('explosion');
                    screenShake.trigger(5, 10);
                }
            }
        }
        
        // Check boss collision
        if (level.boss && level.boss.active && bullet.collidesWith(level.boss)) {
            const damage = bullet.damage || 10;
            level.boss.takeDamage(damage);
            bullet.active = false;
        }
        
        // Off-screen check
        if (bullet.x < cameraX - 50 || bullet.x > cameraX + GAME_WIDTH + 50) {
            bullet.active = false;
        }
    }
    bullets = bullets.filter(b => b.active);
    
    // Update enemy bullets
    for (let bullet of enemyBullets) {
        bullet.update();
        
        if (bullet.collidesWith(player)) {
            player.takeDamage(8);
            bullet.active = false;
            AudioSystem.play('hurt');
            screenShake.trigger(3, 5);
            spawnParticles(player.x + player.width/2, player.y + player.height/2, 8, ['#f00', '#800']);
        }
        
        if (bullet.x < cameraX - 50 || bullet.x > cameraX + GAME_WIDTH + 50 ||
            bullet.y < -50 || bullet.y > GAME_HEIGHT + 50) {
            bullet.active = false;
        }
    }
    enemyBullets = enemyBullets.filter(b => b.active);
    
    // Update enemies
    for (let enemy of level.enemies) {
        if (enemy.active) {
            enemy.update(player, enemyBullets, level.platforms);
            
            // Player collision
            if (enemy.collidesWith(player)) {
                player.takeDamage(enemy.damage);
                AudioSystem.play('hurt');
                screenShake.trigger(4, 8);
            }
        }
    }
    
    // Update boss
    if (level.boss && level.boss.active) {
        level.boss.update(player, bullets, enemyBullets, level.enemies);
        
        // Boss collision with player
        if (level.boss.collidesWith(player)) {
            player.takeDamage(15);
            AudioSystem.play('hurt');
            screenShake.trigger(8, 15);
        }
        
        // Laser collision
        if (level.boss.laserCollidesWith(player, cameraX)) {
            player.takeDamage(2); // Continuous damage from laser
            if (Math.random() > 0.8) {
                spawnParticles(player.x + player.width/2, player.y + player.height/2, 3, ['#f00', '#ff0']);
            }
        }
    }
    
    // Update pickups
    for (let pickup of level.pickups) {
        if (pickup.active) {
            pickup.update();
            
            if (pickup.collidesWith(player)) {
                pickup.active = false;
                AudioSystem.play('pickup');
                
                if (pickup.type === 'health') {
                    player.health = Math.min(player.health + 25, player.maxHealth);
                    spawnParticles(player.x + player.width/2, player.y + player.height/2, 10, ['#0f0', '#8f8']);
                } else if (pickup.type === 'ammo') {
                    player.ammo += 20;
                    spawnParticles(player.x + player.width/2, player.y + player.height/2, 10, ['#ff0', '#fa0']);
                } else if (pickup.type === 'shotgun') {
                    shotgunAmmo += 10;
                    spawnParticles(player.x + player.width/2, player.y + player.height/2, 15, ['#f80', '#f00', '#ff0']);
                    // Show message
                    score += 100;
                }
                score += 50;
            }
        }
    }
    
    // Update explosions
    explosions = explosions.filter(e => e.update());
    
    // Check game over
    if (player.health <= 0) {
        gameState = GameState.GAME_OVER;
        MusicSystem.stop();
    }
    
    // Check stage complete (boss defeated!)
    if (level.boss && !level.boss.active) {
        gameState = GameState.STAGE_COMPLETE;
        MusicSystem.stop();
        score += 2000; // Boss bonus!
    }
}

// Main draw function
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    switch(gameState) {
        case GameState.TITLE:
            drawTitleScreen(ctx);
            break;
            
        case GameState.INTRO:
            drawIntroScreen(ctx, introPage);
            break;
            
        case GameState.PLAYING:
            // Apply screen shake
            ctx.save();
            ctx.translate(screenShake.offsetX, screenShake.offsetY);
            
            // Draw background
            drawBackground(ctx, cameraX);
            
            // Draw platforms
            for (let platform of level.platforms) {
                platform.draw(ctx, cameraX);
            }
            
            // Draw pickups
            for (let pickup of level.pickups) {
                if (pickup.active) pickup.draw(ctx, cameraX);
            }
            
            // Draw enemies
            for (let enemy of level.enemies) {
                if (enemy.active) enemy.draw(ctx, cameraX);
            }
            
            // Draw boss
            if (level.boss && level.boss.active) {
                level.boss.draw(ctx, cameraX);
            }
            
            // Draw player
            player.draw(ctx, cameraX);
            
            // Draw bullets
            for (let bullet of bullets) {
                bullet.draw(ctx, cameraX);
            }
            
            // Draw enemy bullets
            for (let bullet of enemyBullets) {
                bullet.draw(ctx, cameraX);
            }
            
            // Draw explosions
            for (let explosion of explosions) {
                explosion.draw(ctx, cameraX);
            }
            
            // Draw particles
            for (let particle of particles) {
                particle.draw(ctx, cameraX);
            }
            
            // End screen shake
            ctx.restore();
            
            // Draw HUD (outside of shake)
            drawHUD(ctx);
            break;
            
        case GameState.GAME_OVER:
            drawBackground(ctx, cameraX);
            for (let platform of level.platforms) platform.draw(ctx, cameraX);
            player.draw(ctx, cameraX);
            drawGameOverScreen(ctx);
            break;
            
        case GameState.STAGE_COMPLETE:
            drawBackground(ctx, cameraX);
            for (let platform of level.platforms) platform.draw(ctx, cameraX);
            player.draw(ctx, cameraX);
            drawStageCompleteScreen(ctx);
            break;
            
        case GameState.PAUSED:
            // Draw the game state frozen
            drawBackground(ctx, cameraX);
            for (let platform of level.platforms) platform.draw(ctx, cameraX);
            for (let pickup of level.pickups) {
                if (pickup.active) pickup.draw(ctx, cameraX);
            }
            for (let enemy of level.enemies) {
                if (enemy.active) enemy.draw(ctx, cameraX);
            }
            if (level.boss && level.boss.active) {
                level.boss.draw(ctx, cameraX);
            }
            player.draw(ctx, cameraX);
            drawHUD(ctx);
            // Then overlay pause screen
            drawPauseScreen(ctx);
            break;
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // Shooting - Primary weapon (pistol)
    if ((e.code === 'KeyX' || e.code === 'ControlLeft' || e.code === 'ControlRight') && gameState === GameState.PLAYING) {
        const newBullets = player.shoot();
        bullets.push(...newBullets);
    }
    
    // Shooting - Secondary weapon (shotgun)
    if (e.code === 'KeyZ' && gameState === GameState.PLAYING) {
        const pellets = player.shootShotgun();
        bullets.push(...pellets);
    }
    
    // Weapon switch
    if (e.code === 'KeyQ' && gameState === GameState.PLAYING) {
        currentWeapon = currentWeapon === Weapons.PISTOL ? Weapons.SHOTGUN : Weapons.PISTOL;
    }
    
    // Music toggle
    if (e.code === 'KeyM') {
        musicMuted = !musicMuted;
        if (musicMuted) {
            MusicSystem.stop();
        } else if (gameState === GameState.PLAYING) {
            MusicSystem.init();
            MusicSystem.start();
        }
    }
    
    // Pause
    if (e.code === 'Escape' && gameState === GameState.PLAYING) {
        gameState = GameState.PAUSED;
        MusicSystem.stop();
    } else if (e.code === 'Escape' && gameState === GameState.PAUSED) {
        gameState = GameState.PLAYING;
        MusicSystem.start();
    }
    
    // Enter key for state transitions
    if (e.code === 'Enter') {
        switch(gameState) {
            case GameState.TITLE:
                gameState = GameState.INTRO;
                introPage = 0;
                break;
            case GameState.INTRO:
                introPage++;
                if (introPage >= storyPages.length) {
                    gameState = GameState.PLAYING;
                    player.reset();
                    level = createStage1();
                    bullets = [];
                    enemyBullets = [];
                    explosions = [];
                    particles = [];
                    shotgunAmmo = 0;
                    currentWeapon = Weapons.PISTOL;
                    score = 0;
                    cameraX = 0;
                    MusicSystem.init();
                    MusicSystem.start();
                }
                break;
            case GameState.PAUSED:
                gameState = GameState.PLAYING;
                MusicSystem.start();
                break;
            case GameState.GAME_OVER:
                gameState = GameState.PLAYING;
                player.reset();
                level = createStage1();
                bullets = [];
                enemyBullets = [];
                explosions = [];
                particles = [];
                shotgunAmmo = 0;
                currentWeapon = Weapons.PISTOL;
                score = 0;
                cameraX = 0;
                MusicSystem.init();
                MusicSystem.start();
                break;
        }
    }
    
    // Prevent default for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Start the game
console.log('=================================');
console.log('   MAD MUSK - Stage 1 Loaded');
console.log('   Revenge of Luke Newcomb');
console.log('=================================');
gameLoop();
