class KaraokePlayer {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.audioFile = document.getElementById('audioFile');
        this.lyricsText = document.getElementById('lyricsText');
        this.parseLyricsBtn = document.getElementById('parseLyrics');
        this.playerSection = document.getElementById('playerSection');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.progressBar = document.getElementById('progressBar');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.currentLyricsEl = document.getElementById('currentLyrics');
        this.nextLyricsEl = document.getElementById('nextLyrics');
        this.audioCanvas = document.getElementById('audioCanvas');
        this.audioFileName = document.getElementById('audioFileName');
        
        // Sync Mode Elements
        this.startSyncBtn = document.getElementById('startSyncBtn');
        this.syncSection = document.getElementById('syncSection');
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
        
        this.lyrics = [];
        this.currentLyricIndex = 0;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.animationId = null;
        
        // Sync State
        this.syncMode = false;
        this.rawLines = [];
        this.currentSyncIndex = 0;
        this.syncedLines = [];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.audioFile.addEventListener('change', (e) => this.handleAudioUpload(e));
        this.parseLyricsBtn.addEventListener('click', () => this.parseLyrics());
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.progressBar.addEventListener('input', (e) => this.seek(e));
        
        // Sync Mode Event Listeners
        this.startSyncBtn.addEventListener('click', () => this.startSyncMode());
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
                e.preventDefault(); // Prevent page scroll
                this.stampLine();
            }
        });
        
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioPlayer.addEventListener('ended', () => this.stop());
    }
    
    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file && (file.type === 'audio/wav' || file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3'))) {
            const url = URL.createObjectURL(file);
            this.audioPlayer.src = url;
            this.audioFileName.textContent = `📁 ${file.name}`;
            this.checkReadyToPlay();
        } else {
            this.audioFileName.textContent = '❌ Please select a valid WAV or MP3 file';
        }
    }
    
    parseLyrics() {
        const text = this.lyricsText.value.trim();
        if (!text) {
            alert('Please enter some lyrics');
            return;
        }
        
        this.lyrics = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            const match = line.match(/\[(\d{2}):(\d{2})\]\s*(.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const time = minutes * 60 + seconds;
                const lyric = match[3].trim();
                
                if (lyric) {
                    this.lyrics.push({ time, text: lyric });
                }
            } else if (line.trim()) {
                this.lyrics.push({ time: -1, text: line.trim() });
            }
        }
        
        this.lyrics.sort((a, b) => a.time - b.time);
        this.checkReadyToPlay();
        
        if (this.lyrics.length > 0) {
            this.currentLyricsEl.textContent = 'Lyrics loaded! Press play to start';
            this.nextLyricsEl.textContent = '';
        }
    }
    
    checkReadyToPlay() {
        if (this.audioPlayer.src && this.lyrics.length > 0 && !this.syncMode) {
            this.playerSection.style.display = 'block';
            this.syncSection.style.display = 'none';
            this.setupAudioVisualization();
        }
    }

    startSyncMode() {
        const text = this.lyricsText.value.trim();
        if (!text) {
            alert('Please enter some lyrics to sync');
            return;
        }

        if (!this.audioPlayer.src) {
            alert('Please upload an audio track first');
            return;
        }

        // Parse text into raw lines, removing any existing timestamps
        this.rawLines = text.split('\n')
            .map(line => line.replace(/\[\d{2}:\d{2}\]/g, '').trim())
            .filter(line => line.length > 0);

        if (this.rawLines.length === 0) {
            alert('No valid lyrics found');
            return;
        }

        this.syncMode = true;
        this.currentSyncIndex = 0;
        this.syncedLines = [];
        
        // Reset audio
        this.audioPlayer.currentTime = 0;
        this.pause();
        
        // UI Updates
        this.playerSection.style.display = 'none';
        this.syncSection.style.display = 'block';
        this.updateSyncDisplay();
    }

    stampLine() {
        if (!this.syncMode || this.currentSyncIndex >= this.rawLines.length) return;

        const time = this.audioPlayer.currentTime;
        const line = this.rawLines[this.currentSyncIndex];
        const formattedTime = `[${this.formatTime(time)}]`;
        
        this.syncedLines.push(`${formattedTime} ${line}`);
        this.currentSyncIndex++;
        
        // Brief highlight effect on the current line before moving to next
        this.syncCurrentEl.style.transform = 'scale(1.1)';
        this.syncCurrentEl.style.color = '#4CAF50';
        
        setTimeout(() => {
            this.syncCurrentEl.style.transform = 'scale(1)';
            this.syncCurrentEl.style.color = '#e91e63';
            this.updateSyncDisplay();
        }, 150);

        if (this.currentSyncIndex >= this.rawLines.length) {
            this.stampBtn.textContent = '✅ All Lines Synced!';
            this.stampBtn.disabled = true;
            this.stampBtn.style.background = '#4CAF50';
        }
    }

    updateSyncDisplay() {
        if (this.currentSyncIndex > 0) {
            this.syncPreviousEl.textContent = this.rawLines[this.currentSyncIndex - 1];
        } else {
            this.syncPreviousEl.textContent = '';
        }

        if (this.currentSyncIndex < this.rawLines.length) {
            this.syncCurrentEl.textContent = this.rawLines[this.currentSyncIndex];
        } else {
            this.syncCurrentEl.textContent = 'Sync complete!';
        }

        if (this.currentSyncIndex + 1 < this.rawLines.length) {
            this.syncNext1El.textContent = this.rawLines[this.currentSyncIndex + 1];
        } else {
            this.syncNext1El.textContent = '';
        }

        if (this.currentSyncIndex + 2 < this.rawLines.length) {
            this.syncNext2El.textContent = this.rawLines[this.currentSyncIndex + 2];
        } else {
            this.syncNext2El.textContent = '';
        }
    }

    finishSync() {
        if (this.syncedLines.length === 0) {
            this.cancelSync();
            return;
        }

        // Add any remaining unsynced lines without timestamps
        for (let i = this.currentSyncIndex; i < this.rawLines.length; i++) {
            this.syncedLines.push(this.rawLines[i]);
        }

        // Update the main textarea
        this.lyricsText.value = this.syncedLines.join('\n');
        
        // Reset sync state
        this.exitSyncMode();
        
        // Parse the new lyrics and start the player
        this.parseLyrics();
    }

    cancelSync() {
        this.exitSyncMode();
    }

    exitSyncMode() {
        this.syncMode = false;
        this.syncSection.style.display = 'none';
        this.stop();
        
        // Reset button state
        this.stampBtn.textContent = '⏱️ STAMP (Spacebar)';
        this.stampBtn.disabled = false;
        this.stampBtn.style.background = '';
        
        // Return to normal mode if we have valid lyrics and audio
        this.checkReadyToPlay();
    }
    
    setupAudioVisualization() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            this.source = this.audioContext.createMediaElementSource(this.audioPlayer);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }
    
    play() {
        this.audioPlayer.play();
        if (this.syncMode) {
            this.syncPlayBtn.style.display = 'none';
            this.syncPauseBtn.style.display = 'inline-block';
        } else {
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = 'inline-block';
            this.startVisualization();
            this.updateLyrics();
        }
    }
    
    pause() {
        this.audioPlayer.pause();
        if (this.syncMode) {
            this.syncPauseBtn.style.display = 'none';
            this.syncPlayBtn.style.display = 'inline-block';
        } else {
            this.pauseBtn.style.display = 'none';
            this.playBtn.style.display = 'inline-block';
            this.stopVisualization();
        }
    }
    
    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        
        if (this.syncMode) {
            this.syncPauseBtn.style.display = 'none';
            this.syncPlayBtn.style.display = 'inline-block';
            this.syncProgressBar.value = 0;
            this.syncCurrentTimeEl.textContent = '0:00';
            // Also reset sync state
            this.currentSyncIndex = 0;
            this.syncedLines = [];
            this.stampBtn.textContent = '⏱️ STAMP (Spacebar)';
            this.stampBtn.disabled = false;
            this.stampBtn.style.background = '';
            this.updateSyncDisplay();
        } else {
            this.pauseBtn.style.display = 'none';
            this.playBtn.style.display = 'inline-block';
            this.progressBar.value = 0;
            this.currentTimeEl.textContent = '0:00';
            this.currentLyricIndex = 0;
            this.updateLyricsDisplay();
            this.stopVisualization();
        }
    }
    
    seek(event) {
        const seekTime = (event.target.value / 100) * this.audioPlayer.duration;
        this.audioPlayer.currentTime = seekTime;
        this.updateLyrics();
    }
    
    updateProgress() {
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
        const durationStr = this.formatTime(this.audioPlayer.duration);
        this.durationEl.textContent = durationStr;
        if (this.syncMode) {
            this.syncDurationEl.textContent = durationStr;
        }
    }
    
    updateLyrics() {
        const currentTime = this.audioPlayer.currentTime;
        
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (this.lyrics[i].time <= currentTime) {
                if (this.currentLyricIndex !== i) {
                    this.currentLyricIndex = i;
                    this.updateLyricsDisplay();
                }
                break;
            }
        }
    }
    
    updateLyricsDisplay() {
        const currentLyric = this.lyrics[this.currentLyricIndex];
        const nextLyric = this.lyrics[this.currentLyricIndex + 1];
        
        if (currentLyric) {
            this.currentLyricsEl.textContent = currentLyric.text;
            this.currentLyricsEl.className = 'lyrics-line active';
        } else {
            this.currentLyricsEl.textContent = '';
            this.currentLyricsEl.className = 'lyrics-line';
        }
        
        if (nextLyric) {
            this.nextLyricsEl.textContent = nextLyric.text;
            this.nextLyricsEl.className = 'lyrics-line next';
        } else {
            this.nextLyricsEl.textContent = '';
            this.nextLyricsEl.className = 'lyrics-line';
        }
    }
    
    startVisualization() {
        if (!this.analyser) return;
        
        const canvas = this.audioCanvas;
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#f8f9ff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
                
                const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        const canvas = this.audioCanvas;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f9ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KaraokePlayer();
});
