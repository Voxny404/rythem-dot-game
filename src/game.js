
class Game {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.audioPlayer = document.getElementById("audioPlayer");

        this.bands = [
            { ranges: [[20, 150]] },       // Dot 1: Kick / bass
            { ranges: [[150, 400]] },      // Dot 2: Bass / low guitar
            { ranges: [[400, 2000]] },     // Dot 3: Guitar / snare body
            { ranges: [[2000, 6000]] },    // Dot 4: Cymbals / highs
            { ranges: [[6000, 12000]] }    // Dot 5: Extreme highs
        ];

        this.dotOffset = 300;
        this.dotPositions = [
            { x: this.dotOffset + 50, y: this.canvas.height - 50 },
            { x: this.dotOffset + 150, y: this.canvas.height - 50 },
            { x: this.dotOffset + 250, y: this.canvas.height - 50 },
            { x: this.dotOffset + 350, y: this.canvas.height - 50 },
            { x: this.dotOffset + 450, y: this.canvas.height - 50 }
        ];

        this.bpmReady = false;

        this.lastHit = [0, 0, 0, 0, 0];
        this.hitCooldown = 100;

        this.multiplierThresholds = [5, 10, 20];
        this.hitParticles = [];
        this.bandHistory = [0, 0, 0, 0, 0];
        this.lastSpawnTime = [0, 0, 0, 0, 0];
        this.lastGlobalSpawn = 0;
        this.predictions = [];
        this.hitStreak = 0;
        this.fallTime = 0;

        this.fallMulti = 1.5;
        this.maxActiveNotes = 8;
        this.advance = 50; // ms beat offset

        this.dotCap = 7; // max number of displayed dots
        this.score = 0;
        this.challangerScore = 0;
        this.scoreMultiplier = 1;
        this.animationFrameId = null;

        this.lastFrameTime = performance.now();
    }

    async init() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(this.audioPlayer);
        const analyser = audioContext.createAnalyser();

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 4096;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const resultBPM = await this.estimateBPM();
        this.bpmReady = true;
        const config = this.configureForBPM(resultBPM);

        config.audioContext = audioContext;
        config.source = source;
        config.analyser = analyser;
        config.dataArray = dataArray;

        this.audioPlayer.play();
        this.draw(config);
    }

    async estimateBPM() {
        return new Promise((resolve) => {
            const tempContext = new (window.AudioContext || window.webkitAudioContext)();
            const reader = new FileReader();

            reader.onload = function (e) {
                tempContext.decodeAudioData(e.target.result).then((buffer) => {
                    const channel = buffer.getChannelData(0);
                    const sampleRate = buffer.sampleRate;
                    const samples = channel.slice(0, sampleRate * 10); // 10 seconds

                    const peaks = [];
                    const threshold = 0.9;
                    for (let i = 1; i < samples.length; i++) {
                        if (samples[i] > threshold && samples[i] > samples[i - 1]) {
                            peaks.push(i);
                            i += 1000;
                        }
                    }

                    if (peaks.length < 2) resolve(120);

                    const intervals = peaks.map((p, i) => peaks[i + 1] - p).filter(x => x);
                    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                    let bpm = 60 / (avg / sampleRate);
                    bpm = Math.round(bpm);

                    resolve(Math.min(200, Math.max(60, bpm)));
                });
            };

            fetch(this.audioPlayer.src)
                .then(r => r.arrayBuffer())
                .then(buf => reader.readAsArrayBuffer(new Blob([buf])));
        });
    }

    configureForBPM(bpm) {
        const fallTime = this.mapValue(bpm, 60, 180, 1300, 900) * this.fallMulti;
        const globalSpawnGap = this.mapValue(bpm, 60, 180, 200, 110);

        const scaledMax = this.mapValue(bpm, 60, 180, 6, 14);
        const maxActiveNotes = Math.min(this.dotCap, scaledMax);

        const baseSensitivity = this.mapValue(bpm, 60, 180, 1.05, 1.18);
        const minSpawnGap = this.mapValue(bpm, 60, 180, 200, 130);

        this.fallTime = fallTime;
        return { globalSpawnGap, maxActiveNotes, baseSensitivity, minSpawnGap };
    }

    mapValue(val, inMin, inMax, outMin, outMax) {
        return outMin + ((val - inMin) * (outMax - outMin)) / (inMax - inMin);
    }

    draw(config) {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.animationFrameId = requestAnimationFrame(this.draw.bind(this, config));

        config.analyser.getByteFrequencyData(config.dataArray);
        updateGamepadState();

        // clear canvas
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw score
        this.ctx.fillStyle = "white";
        this.ctx.font = "24px Arial";
        this.ctx.textAlign = "right";
        this.ctx.fillText("Score: " + this.score, this.canvas.width - 10, 30);
        this.ctx.fillText("x" + this.scoreMultiplier, this.canvas.width - 10, 60);
        if (this.challangerScore) {
            this.ctx.fillText("Challenger Score: " + this.challangerScore, this.canvas.width - 10, 90);
        }

        const smoothing = 0.3; // reduced for responsiveness

        this.bands.forEach((band, i) => {
            const avg = this.getFrequencyRangeAvg(
                config.dataArray,
                config.audioContext.sampleRate,
                config.analyser.fftSize,
                band.ranges
            );

            const diff = avg - this.bandHistory[i];

            // beat detection
            const beat = diff > Math.max(this.bandHistory[i] * (config.baseSensitivity - 1), 5);

            if (
                beat &&
                now - this.lastSpawnTime[i] > config.minSpawnGap &&
                now - this.lastGlobalSpawn > config.globalSpawnGap &&
                this.canSpawnInLane(i) &&
                this.predictions.length < config.maxActiveNotes
            ) {
                this.spawnDot(i, diff, this.fallTime);
                this.lastSpawnTime[i] = now;
                this.lastGlobalSpawn = now;
            }

            this.bandHistory[i] = this.bandHistory[i] * smoothing + avg * (1 - smoothing);

            const pos = this.dotPositions[i];
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);

            const keyStates = [isAPressed, isSPressed, isDPressed, isFPressed, isGPressed];
            this.ctx.fillStyle = keyStates[i] ? `hsl(${i * 60}, 100%, 60%)` : "rgba(255,255,255,0.12)";
            this.ctx.fill();
        });

        this.drawPredictions(deltaTime);
        this.drawHitParticles();
    }

    getFrequencyRangeAvg(data, sampleRate, fftSize, ranges) {
        let total = 0, count = 0;
        let peak = 0;
        const hzPerBin = sampleRate / fftSize;

        ranges.forEach(([lowHz, highHz], i) => {
            const start = Math.max(0, Math.round(lowHz / hzPerBin));
            const end = Math.min(data.length - 1, Math.round(highHz / hzPerBin));
            const weight = 1 + i * 0.5;

            for (let j = start; j <= end; j++) {
                total += data[j] * weight;
                count += weight;
                if (data[j] > peak) peak = data[j];
            }
        });

        const avg = count > 0 ? total / count : 0;
        return Math.max(avg, peak * 0.7);
    }

    canSpawnInLane(band) {
        for (let p of this.predictions)
            if (p.band === band && p.y < -120) return false;
        return true;
    }

    spawnDot(band, strength, fallTime) {
        const pos = this.dotPositions[band];
        const spawnY = -150;
        const targetY = pos.y;
        const distance = targetY - spawnY;
        const velocity = distance / fallTime; // pixels per ms

        // small prediction offset (dots appear slightly earlier)
        const advance = this.advance; // ms
        const adjustedY = spawnY - velocity * advance;

        this.predictions.push({ band, x: pos.x, y: adjustedY, velocity, strength, spawnY: adjustedY, targetY });
    }

    drawPredictions(deltaTime) {
        for (let i = this.predictions.length - 1; i >= 0; i--) {
            const p = this.predictions[i];
            p.y += p.velocity * deltaTime; // time-based movement

            const progress = (p.y - p.spawnY) / (p.targetY - p.spawnY);
            const eased = Math.pow(progress, 0.65);

            const minSize = 6;
            const maxSize = 22 + p.strength * 0.03;
            const size = minSize + (maxSize - minSize) * eased;
            const alpha = Math.min(0.88, 0.35 + eased * 0.55);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.band * 60}, 100%, 60%, ${alpha})`;
            this.ctx.fill();

            if (p.y >= p.targetY + 70) {
                this.predictions.splice(i, 1);
                this.score = Math.max(0, this.score - 2);
                this.hitStreak = 0;
                this.scoreMultiplier = 1;
            }
        }
    }

    drawHitParticles() {
        for (let i = this.hitParticles.length - 1; i >= 0; i--) {
            const p = this.hitParticles[i];
            p.x += p.velocityX;
            p.y += p.velocityY;
            p.alpha -= 0.03;
            if (p.alpha <= 0) this.hitParticles.splice(i, 1);
            else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
                this.ctx.fill();
            }
        }
    }

    spawnHitParticles(x, y, band) {
        const numParticles = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.hitParticles.push({
                x, y,
                size: 4 + Math.random() * 3,
                alpha: 1,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                hue: band * 60
            });
        }
    }

    checkHit(bandIndex) {
        const now = performance.now();
        if (now - this.lastHit[bandIndex] < this.hitCooldown) return;

        const hitRange = Math.max(50, this.fallTime / 50);
        let hit = false;

        for (let i = this.predictions.length - 1; i >= 0; i--) {
            const p = this.predictions[i];
            if (p.band === bandIndex) {
                const dist = Math.abs(p.y - p.targetY);
                if (dist <= hitRange) {
                    this.predictions.splice(i, 1);
                    hit = true;
                    this.lastHit[bandIndex] = now;
                    this.hitStreak++;

                    if (this.hitStreak >= this.multiplierThresholds[2]) this.scoreMultiplier = 4;
                    else if (this.hitStreak >= this.multiplierThresholds[1]) this.scoreMultiplier = 3;
                    else if (this.hitStreak >= this.multiplierThresholds[0]) this.scoreMultiplier = 2;
                    else this.scoreMultiplier = 1;

                    this.score += 10 * this.scoreMultiplier;
                    if (network?.initialized) network.sendMsg({ score: this.score });
                    this.spawnHitParticles(p.x, p.targetY, p.band);

                    break;
                }
            }
        }

        if (!hit) {
            this.hitStreak = 0;
            this.scoreMultiplier = 1;
            this.score = Math.max(0, this.score - 2);
            this.lastHit[bandIndex] = now;
            if (network?.initialized) network.sendMsg({ score: this.score });
        }
    }

    setChallangerScore(score) {
        this.challangerScore = score;
    }
}

