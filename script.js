/**
 * KaraokePlayer — Main application class
 *
 * Architecture:
 *   - Views: setupView (upload/lyrics), syncView (interactive sync), playerView (theater karaoke)
 *   - Audio: HTML5 <audio> element for playback, wavesurfer.js for waveform visualization
 *   - Lyrics: Custom wipe engine using CSS custom property --wipe and requestAnimationFrame
 *
 * Open Source Dependencies:
 *   - Tailwind CSS (MIT) — layout & styling via CDN
 *   - wavesurfer.js (BSD-3) — audio waveform via CDN
 */
class KaraokePlayer {
    constructor() {
        // --- Audio ---
        this.audioPlayer = document.getElementById('audioPlayer');
        this.audioFile = document.getElementById('audioFile');
        this.audioFileName = document.getElementById('audioFileName');
        this.audioFileUrl = null;

        // --- Views ---
        this.setupView = document.getElementById('setupView');
        this.syncView = document.getElementById('syncView');
        this.playerView = document.getElementById('playerView');

        // --- Setup View Elements ---
        this.lyricsText = document.getElementById('lyricsText');
        this.parseLyricsBtn = document.getElementById('parseLyrics');
        this.autoSyncBtn = document.getElementById('autoSyncBtn');
        this.syncStatus = document.getElementById('syncStatus');
        this.startSyncBtn = document.getElementById('startSyncBtn');

        // --- Player View Elements ---
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.exitTheaterBtn = document.getElementById('exitTheaterBtn');
        this.progressBar = document.getElementById('progressBar');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.lyricsContainer = document.getElementById('lyricsContainer');
        this.lyricsWindow = document.getElementById('lyricsWindow');

        // --- Sync View Elements ---
        this.syncPlayBtn = document.getElementById('syncPlayBtn');
        this.syncPauseBtn = document.getElementById('syncPauseBtn');
        this.syncStopBtn = document.getElementById('syncStopBtn');
        this.syncProgressBar = document.getElementById('syncProgressBar');
        this.syncCurrentTimeEl = document.getElementById('syncCurrentTime');
        this.syncDurationEl = document.getElementById('syncDuration');
        this.stampBtn = document.getElementById('stampBtn');
        this.syncPreviousEl = document.getElementById('syncPrevious');
        this.syncCurrentEl = document.getElementById('syncCurrent');
        this.syncNext1El = document.getElementById('syncNext1');
        this.syncNext2El = document.getElementById('syncNext2');
        this.finishSyncBtn = document.getElementById('finishSyncBtn');
        this.cancelSyncBtn = document.getElementById('cancelSyncBtn');

        // --- Wavesurfer.js instance ---
        this.wavesurfer = null;

        // --- State ---
        this.lyrics = [];
        this.lineElements = [];
        this.currentLyricIndex = 0;
        this.playerLoopId = null;
        this.syncMode = false;
        this.rawLines = [];
        this.currentSyncIndex = 0;
        this.syncedLines = [];

        this.initializeEventListeners();
    }

    // ─── WAVESURFER.JS SETUP ─────────────────────────────────
    initWavesurfer() {
        // Single waveform instance for setup view preview
        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#4a5568',
            progressColor: '#00e5ff',
            cursorColor: '#ff007f',
            barWidth: 3,
            barRadius: 3,
            barGap: 2,
            height: 80,
            media: this.audioPlayer,
        });
    }

    // ─── EVENT LISTENERS ─────────────────────────────────────
    initializeEventListeners() {
        this.audioFile.addEventListener('change', (e) => this.handleAudioUpload(e));
        this.parseLyricsBtn.addEventListener('click', () => this.parseLyrics());
        this.autoSyncBtn.addEventListener('click', () => this.autoSync());
        this.startSyncBtn.addEventListener('click', () => this.startSyncMode());

        // Player controls
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.exitTheaterBtn.addEventListener('click', () => this.exitTheater());
        this.progressBar.addEventListener('input', (e) => this.seek(e));

        // Sync controls
        this.syncPlayBtn.addEventListener('click', () => this.play());
        this.syncPauseBtn.addEventListener('click', () => this.pause());
        this.syncStopBtn.addEventListener('click', () => this.stop());
        this.syncProgressBar.addEventListener('input', (e) => this.seek(e));
        this.stampBtn.addEventListener('click', () => this.stampLine());
        this.finishSyncBtn.addEventListener('click', () => this.finishSync());
        this.cancelSyncBtn.addEventListener('click', () => this.cancelSync());

        // Spacebar for stamping
        document.addEventListener('keydown', (e) => {
            if (this.syncMode && e.code === 'Space' && document.activeElement !== this.lyricsText) {
                e.preventDefault();
                this.stampLine();
            }
        });

        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioPlayer.addEventListener('ended', () => this.stop());
    }

    // ─── VIEW MANAGEMENT ─────────────────────────────────────
    showView(viewName) {
        this.setupView.classList.add('hidden');
        this.syncView.classList.add('hidden');
        this.playerView.classList.add('hidden');

        if (viewName === 'setup') this.setupView.classList.remove('hidden');
        if (viewName === 'sync') this.syncView.classList.remove('hidden');
        if (viewName === 'player') this.playerView.classList.remove('hidden');
    }

    // ─── AUDIO UPLOAD ────────────────────────────────────────
    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file && (file.type === 'audio/wav' || file.type === 'audio/mpeg' || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
            this.audioFileName.textContent = file.name;
            this.audioFileUrl = URL.createObjectURL(file);
            this.audioPlayer.src = this.audioFileUrl;
            this.audioPlayer.load();

            // Show waveform preview and init wavesurfer (must be visible first)
            const waveformSetup = document.getElementById('waveformSetup');
            waveformSetup.classList.remove('hidden');
            if (!this.wavesurfer) this.initWavesurfer();
        } else {
            alert('Please select a valid WAV or MP3 file');
        }
    }

    // ─── LYRICS PARSING ──────────────────────────────────────
    parseLyrics() {
        const text = this.lyricsText.value.trim();
        if (!text) { alert('Please enter some lyrics'); return; }

        this.lyrics = [];
        const lines = text.split('\n');

        for (const line of lines) {
            const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseFloat(match[2]);
                const time = minutes * 60 + seconds;
                const lyric = match[3].trim();
                if (lyric) this.lyrics.push({ time, text: lyric });
            } else if (line.trim()) {
                this.lyrics.push({ time: 999999, text: line.trim() });
            }
        }

        this.lyrics.sort((a, b) => a.time - b.time);

        if (this.lyrics.length > 0 && this.audioPlayer.src && !this.syncMode) {
            this.currentLyricIndex = 0;
            this.renderLyricsUI();
            this.showView('player');
        }
    }

    // ─── AUTO SYNC ───────────────────────────────────────────
    async autoSync() {
        const text = this.lyricsText.value.trim();
        const file = this.audioFile.files[0];

        if (!text) { alert('Please enter some lyrics first'); return; }
        if (!file) { alert('Please select an audio file first'); return; }

        if (!this.audioPlayer.src) {
            this.audioFileUrl = URL.createObjectURL(file);
            this.audioPlayer.src = this.audioFileUrl;
            this.audioPlayer.load();
        }

        this.syncStatus.classList.remove('hidden');
        this.syncStatus.textContent = '⏳ Processing audio... This may take a minute.';
        this.syncStatus.className = 'mt-3 text-sm text-center text-amber-400';
        this.autoSyncBtn.disabled = true;

        const formData = new FormData();
        formData.append('audio', file);
        formData.append('lyrics', text);

        try {
            const backendUrl = `http://${window.location.hostname}:5000/api/sync`;
            const response = await fetch(backendUrl, { method: 'POST', body: formData });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server returned ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.lyricsText.value = data.synced_lyrics;
                this.syncStatus.textContent = '✅ Synchronization complete!';
                this.syncStatus.className = 'mt-3 text-sm text-center text-green-400';
                this.parseLyrics();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Auto-sync error:', error);
            this.syncStatus.textContent = `❌ Error: ${error.message}`;
            this.syncStatus.className = 'mt-3 text-sm text-center text-red-400';
            alert(`Auto-Sync Failed: ${error.message}\n\nEnsure 'python app.py' is running.`);
        } finally {
            this.autoSyncBtn.disabled = false;
            setTimeout(() => { this.syncStatus.classList.add('hidden'); }, 10000);
        }
    }

    // ─── INTERACTIVE SYNC ────────────────────────────────────
    startSyncMode() {
        const text = this.lyricsText.value.trim();
        if (!text) { alert('Please enter some lyrics to sync'); return; }
        if (!this.audioPlayer.src) { alert('Please upload an audio track first'); return; }

        this.rawLines = text.split('\n')
            .map(line => line.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim())
            .filter(line => line.length > 0);

        if (this.rawLines.length === 0) { alert('No valid lyrics found'); return; }

        this.syncMode = true;
        this.currentSyncIndex = 0;
        this.syncedLines = [];
        this.audioPlayer.currentTime = 0;
        this.audioPlayer.pause();

        this.showView('sync');
        this.updateSyncDisplay();
    }

    stampLine() {
        if (!this.syncMode || this.currentSyncIndex >= this.rawLines.length) return;

        const time = this.audioPlayer.currentTime;
        const line = this.rawLines[this.currentSyncIndex];
        this.syncedLines.push(`[${this.formatTime(time)}] ${line}`);
        this.currentSyncIndex++;

        this.syncCurrentEl.style.transform = 'scale(1.1)';
        this.syncCurrentEl.classList.add('text-green-400');
        setTimeout(() => {
            this.syncCurrentEl.style.transform = 'scale(1)';
            this.syncCurrentEl.classList.remove('text-green-400');
            this.updateSyncDisplay();
        }, 150);

        if (this.currentSyncIndex >= this.rawLines.length) {
            this.stampBtn.textContent = '✅ All Lines Synced!';
            this.stampBtn.disabled = true;
            this.stampBtn.classList.replace('bg-karaoke-pink', 'bg-green-600');
        }
    }

    updateSyncDisplay() {
        this.syncPreviousEl.textContent = this.currentSyncIndex > 0 ? this.rawLines[this.currentSyncIndex - 1] : '';
        this.syncCurrentEl.textContent = this.currentSyncIndex < this.rawLines.length ? this.rawLines[this.currentSyncIndex] : 'Sync complete!';
        this.syncNext1El.textContent = this.currentSyncIndex + 1 < this.rawLines.length ? this.rawLines[this.currentSyncIndex + 1] : '';
        this.syncNext2El.textContent = this.currentSyncIndex + 2 < this.rawLines.length ? this.rawLines[this.currentSyncIndex + 2] : '';
    }

    finishSync() {
        if (this.syncedLines.length === 0) { this.cancelSync(); return; }

        for (let i = this.currentSyncIndex; i < this.rawLines.length; i++) {
            this.syncedLines.push(this.rawLines[i]);
        }

        this.lyricsText.value = this.syncedLines.join('\n');
        this.exitSyncMode();
        this.parseLyrics();
    }

    cancelSync() { this.exitSyncMode(); }

    exitSyncMode() {
        this.syncMode = false;
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;

        this.stampBtn.textContent = '⏱️ STAMP (Spacebar)';
        this.stampBtn.disabled = false;
        this.stampBtn.classList.replace('bg-green-600', 'bg-karaoke-pink');

        this.showView('setup');
    }

    // ─── PLAYBACK ────────────────────────────────────────────
    play() {
        const playPromise = this.audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("Audio playing.");
            }).catch(e => {
                console.error("Playback failed:", e);
                alert("Playback failed: " + e.message);
            });
        }

        if (this.syncMode) {
            this.syncPlayBtn.classList.add('hidden');
            this.syncPauseBtn.classList.remove('hidden');
        } else {
            this.playBtn.classList.add('hidden');
            this.pauseBtn.classList.remove('hidden');
            this.startPlayerLoop();
        }
    }

    pause() {
        this.audioPlayer.pause();
        if (this.syncMode) {
            this.syncPauseBtn.classList.add('hidden');
            this.syncPlayBtn.classList.remove('hidden');
        } else {
            this.pauseBtn.classList.add('hidden');
            this.playBtn.classList.remove('hidden');
            this.stopPlayerLoop();
        }
    }

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;

        if (this.syncMode) {
            this.syncPauseBtn.classList.add('hidden');
            this.syncPlayBtn.classList.remove('hidden');
            this.syncProgressBar.value = 0;
            this.syncCurrentTimeEl.textContent = '0:00';
            this.currentSyncIndex = 0;
            this.syncedLines = [];
            this.stampBtn.textContent = '⏱️ STAMP (Spacebar)';
            this.stampBtn.disabled = false;
            this.stampBtn.classList.replace('bg-green-600', 'bg-karaoke-pink');
            this.updateSyncDisplay();
        } else {
            this.pauseBtn.classList.add('hidden');
            this.playBtn.classList.remove('hidden');
            this.progressBar.value = 0;
            this.currentTimeEl.textContent = '0:00';
            this.currentLyricIndex = 0;
            this.updateLyricsDisplay();
            this.stopPlayerLoop();
        }
    }

    exitTheater() {
        this.stop();
        this.showView('setup');
    }

    seek(event) {
        const seekTime = (event.target.value / 100) * this.audioPlayer.duration;
        this.audioPlayer.currentTime = seekTime;
        this.updateLyrics();
    }

    updateProgress() {
        if (!this.audioPlayer.duration) return;
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        this.progressBar.value = progress;
        this.currentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime);

        if (this.syncMode) {
            this.syncProgressBar.value = progress;
            this.syncCurrentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
        this.updateLyrics();
    }

    updateDuration() {
        const d = this.formatTime(this.audioPlayer.duration);
        this.durationEl.textContent = d;
        if (this.syncMode) this.syncDurationEl.textContent = d;
    }

    // ─── LYRICS UI ───────────────────────────────────────────
    renderLyricsUI() {
        this.lyricsContainer.innerHTML = '';
        this.lineElements = [];

        if (this.lyrics.length === 0) {
            const el = document.createElement('div');
            el.className = 'karaoke-line active';
            el.textContent = 'Upload audio and lyrics to start';
            this.lyricsContainer.appendChild(el);
            return;
        }

        this.lyrics.forEach((lyric) => {
            const el = document.createElement('div');
            el.className = 'karaoke-line upcoming';
            el.textContent = lyric.text;
            if (lyric.time === 999999) el.style.opacity = '0.15';
            this.lyricsContainer.appendChild(el);
            this.lineElements.push(el);
        });

        this.updateLyrics();
    }

    startPlayerLoop() {
        if (this.playerLoopId) cancelAnimationFrame(this.playerLoopId);
        const loop = () => {
            if (!this.audioPlayer.paused && !this.syncMode) this.updateLyrics();
            this.playerLoopId = requestAnimationFrame(loop);
        };
        this.playerLoopId = requestAnimationFrame(loop);
    }

    stopPlayerLoop() {
        if (this.playerLoopId) { cancelAnimationFrame(this.playerLoopId); this.playerLoopId = null; }
    }

    updateLyrics() {
        if (this.lyrics.length === 0 || this.lineElements.length === 0) return;
        const currentTime = this.audioPlayer.currentTime;
        let newIndex = 0;
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (this.lyrics[i].time <= currentTime && this.lyrics[i].time !== 999999) {
                newIndex = i;
                break;
            }
        }
        this.currentLyricIndex = newIndex;
        this.updateLyricsDisplay();
    }

    updateLyricsDisplay() {
        if (this.lineElements.length === 0) return;
        const currentTime = this.audioPlayer.currentTime;
        let activeEl = null;

        for (let i = 0; i < this.lineElements.length; i++) {
            const el = this.lineElements[i];
            el.style.removeProperty('--wipe');

            if (i < this.currentLyricIndex) {
                el.className = 'karaoke-line past';
            } else if (i === this.currentLyricIndex) {
                el.className = 'karaoke-line active';
                activeEl = el;
            } else {
                el.className = 'karaoke-line upcoming';
            }
        }

        // Karaoke Wipe Effect
        if (activeEl && this.lyrics[this.currentLyricIndex]) {
            const currentLineTime = this.lyrics[this.currentLyricIndex].time;
            let nextLineTime = this.audioPlayer.duration;
            for (let i = this.currentLyricIndex + 1; i < this.lyrics.length; i++) {
                if (this.lyrics[i].time !== 999999) { nextLineTime = this.lyrics[i].time; break; }
            }
            const lineDuration = nextLineTime - currentLineTime;
            if (lineDuration > 0.1) {
                let pct = ((currentTime - currentLineTime) / lineDuration) * 100;
                pct = Math.max(0, Math.min(100, pct));
                activeEl.style.setProperty('--wipe', `${pct}%`);
            } else {
                activeEl.style.setProperty('--wipe', '100%');
            }
        }

        // Scroll to center active lyric
        if (activeEl) {
            const windowH = this.lyricsWindow.clientHeight;
            let offset = 0;
            for (let i = 0; i < this.currentLyricIndex; i++) {
                offset += this.lineElements[i].offsetHeight + 24;
            }
            const activeH = activeEl.offsetHeight + 24;
            const translateY = -(offset - (windowH / 2) + (activeH / 2));
            this.lyricsContainer.style.transform = `translateY(${translateY}px)`;
        }
    }

    // ─── UTIL ────────────────────────────────────────────────
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KaraokePlayer();
});
