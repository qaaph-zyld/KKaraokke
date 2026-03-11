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
        this.autoSyncBtn = document.getElementById('autoSyncBtn');
        this.syncStatus = document.getElementById('syncStatus');
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
        
        // Main Player Lyrics UI
        this.lyricsContainer = document.getElementById('lyricsContainer');
        this.lineElements = [];
        this.playerLoopId = null;
        
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
        this.autoSyncBtn.addEventListener('click', () => this.autoSync());
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
        if (file && (file.type === 'audio/wav' || file.type === 'audio/mpeg' || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
            this.audioFileName.textContent = file.name;
            const url = URL.createObjectURL(file);
            this.audioPlayer.src = url;
            this.audioPlayer.load(); // Explicitly load the audio source
            this.checkReadyToPlay();
        } else {
            alert('Please select a valid WAV or MP3 file');
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
            // Regex to match [MM:SS] or [MM:SS.xx]
            const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseFloat(match[2]);
                const time = minutes * 60 + seconds;
                const lyric = match[3].trim();
                
                if (lyric) {
                    this.lyrics.push({ time, text: lyric });
                }
            } else if (line.trim()) {
                // If it doesn't have a valid timestamp, don't give it a negative time which breaks the engine.
                // We'll skip it for actual sync, or could try to assign it to end, but skipping is safer.
                // Alternatively, we give it a very high time so it appears at the end.
                this.lyrics.push({ time: 999999, text: line.trim() });
            }
        }
        
        this.lyrics.sort((a, b) => a.time - b.time);
        
        // Remove lines with time = 999999 if we have real lyrics, or just leave them at the end.
        this.checkReadyToPlay();
        
        if (this.lyrics.length > 0) {
            this.currentLyricIndex = 0;
            this.renderLyricsUI();
        }
    }
    
    checkReadyToPlay() {
        if (this.audioPlayer.src && this.lyrics.length > 0 && !this.syncMode) {
            this.playerSection.style.display = 'block';
            this.syncSection.style.display = 'none';
            // DO NOT call setupAudioVisualization here, as it requires user interaction first
            // It will be called inside the play() function instead
        }
    }

    async autoSync() {
        console.log("AutoSync button clicked");
        const text = this.lyricsText.value.trim();
        const file = this.audioFile.files[0];

        if (!text) {
            alert('Please enter some lyrics first');
            return;
        }

        if (!file) {
            alert('Please select an audio file first');
            return;
        }

        // Ensure audio player has the src set before sync in case it was missed
        if (!this.audioPlayer.src) {
            const url = URL.createObjectURL(file);
            this.audioPlayer.src = url;
            this.audioPlayer.load();
        }

        this.syncStatus.style.display = 'block';
        this.syncStatus.textContent = '⏳ Processing audio... This may take a minute depending on the file size. Check IDE console for backend progress.';
        this.syncStatus.style.color = '#333';
        this.autoSyncBtn.disabled = true;

        const formData = new FormData();
        formData.append('audio', file);
        formData.append('lyrics', text);

        try {
            console.log("Sending request to backend...");
            // Use the exact same hostname as the frontend to completely avoid localhost vs 127.0.0.1 mismatches
            const backendUrl = `http://${window.location.hostname}:5000/api/sync`;
            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server returned ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Received data:", data);
            
            if (data.success) {
                this.lyricsText.value = data.synced_lyrics;
                this.syncStatus.textContent = '✅ Synchronization complete!';
                this.syncStatus.style.color = '#4CAF50';
                this.parseLyrics(); // Immediately load the new synced lyrics
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Auto-sync error:', error);
            this.syncStatus.textContent = `❌ Error: ${error.message}. Is the Python backend running on port 5000?`;
            this.syncStatus.style.color = '#f44336';
            alert(`Auto-Sync Failed: ${error.message}\n\nPlease ensure you ran 'python app.py' in the terminal.`);
        } finally {
            this.autoSyncBtn.disabled = false;
            // Hide status message after 10 seconds (increased from 5 for errors to be readable)
            setTimeout(() => {
                this.syncStatus.style.display = 'none';
            }, 10000);
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
        // Only setup if we don't have a context yet. This is called from play() which is a user gesture.
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                
                this.source = this.audioContext.createMediaElementSource(this.audioPlayer);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                // Force resume just in case browser created it in suspended state
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            } catch (e) {
                console.error("AudioContext setup failed:", e);
            }
        }
    }
    
    play() {
        console.log("Play clicked. Audio state:", this.audioPlayer.readyState, "Src:", this.audioPlayer.src);
        
        // Setup visualization here where user explicitly clicked play
        if (!this.audioContext) {
            this.setupAudioVisualization();
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const playPromise = this.audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("Audio playing successfully.");
            }).catch(e => {
                console.error("Playback failed:", e);
                alert("Playback failed. Error: " + e.message);
            });
        }

        if (this.syncMode) {
            this.syncPlayBtn.style.display = 'none';
            this.syncPauseBtn.style.display = 'inline-block';
        } else {
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = 'inline-block';
            
            // Enable Theater Mode for immersive karaoke
            document.body.classList.add('theater-mode');
            const setupSection = document.getElementById('setupSection');
            if (setupSection) setupSection.classList.add('hidden');
            
            this.startVisualization();
            this.startPlayerLoop();
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
            
            // Disable Theater Mode to show controls again
            document.body.classList.remove('theater-mode');
            const setupSection = document.getElementById('setupSection');
            if (setupSection) setupSection.classList.remove('hidden');
            
            this.stopVisualization();
            this.stopPlayerLoop();
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
            
            // Disable Theater Mode
            document.body.classList.remove('theater-mode');
            const setupSection = document.getElementById('setupSection');
            if (setupSection) setupSection.classList.remove('hidden');
            
            this.progressBar.value = 0;
            this.currentTimeEl.textContent = '0:00';
            this.currentLyricIndex = 0;
            this.updateLyricsDisplay();
            this.stopVisualization();
            this.stopPlayerLoop();
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
    
    renderLyricsUI() {
        this.lyricsContainer.innerHTML = '';
        this.lineElements = [];
        
        if (this.lyrics.length === 0) {
            const el = document.createElement('div');
            el.className = 'lyrics-line active';
            el.textContent = 'Upload audio and lyrics to start';
            this.lyricsContainer.appendChild(el);
            return;
        }

        this.lyrics.forEach((lyric, index) => {
            const el = document.createElement('div');
            el.className = 'lyrics-line upcoming';
            el.textContent = lyric.text;
            
            // If it's one of the lines with no valid timestamp (the 999999 ones), we can style them differently or just keep them upcoming
            if (lyric.time === 999999) {
                el.style.opacity = '0.2';
            }
            
            this.lyricsContainer.appendChild(el);
            this.lineElements.push(el);
        });
        
        this.updateLyrics();
    }

    startPlayerLoop() {
        if (this.playerLoopId) {
            cancelAnimationFrame(this.playerLoopId);
        }
        
        const loop = () => {
            if (!this.audioPlayer.paused && !this.syncMode) {
                this.updateLyrics();
            }
            this.playerLoopId = requestAnimationFrame(loop);
        };
        
        this.playerLoopId = requestAnimationFrame(loop);
    }

    stopPlayerLoop() {
        if (this.playerLoopId) {
            cancelAnimationFrame(this.playerLoopId);
            this.playerLoopId = null;
        }
    }

    updateLyrics() {
        if (this.lyrics.length === 0 || this.lineElements.length === 0) return;
        
        const currentTime = this.audioPlayer.currentTime;
        let newIndex = 0;
        
        // Find the active lyric line
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            // Ignore the un-timestamped placeholder lines for matching the active line
            if (this.lyrics[i].time <= currentTime && this.lyrics[i].time !== 999999) {
                newIndex = i;
                break;
            }
        }
        
        this.currentLyricIndex = newIndex;
        // Always call updateLyricsDisplay on every frame to animate the wipe effect
        this.updateLyricsDisplay();
    }
    
    updateLyricsDisplay() {
        if (this.lineElements.length === 0) return;

        const currentTime = this.audioPlayer.currentTime;
        let activeEl = null;

        // Update classes for all lines and clear any old variables
        for (let i = 0; i < this.lineElements.length; i++) {
            const el = this.lineElements[i];
            el.style.removeProperty('--fill-percentage'); // Reset wipe effect for all lines
            
            if (i < this.currentLyricIndex) {
                el.className = 'lyrics-line past';
            } else if (i === this.currentLyricIndex) {
                el.className = 'lyrics-line active';
                activeEl = el;
            } else {
                el.className = 'lyrics-line upcoming';
            }
        }

        // Calculate and apply Karaoke Wipe effect to the active line
        if (activeEl && this.lyrics[this.currentLyricIndex]) {
            const currentLineTime = this.lyrics[this.currentLyricIndex].time;
            
            // Find the time of the *next valid* line to determine the duration of the current line
            let nextLineTime = this.audioPlayer.duration; // Default to end of song
            for (let i = this.currentLyricIndex + 1; i < this.lyrics.length; i++) {
                if (this.lyrics[i].time !== 999999) {
                    nextLineTime = this.lyrics[i].time;
                    break;
                }
            }

            // Calculate progress through the current line
            const lineDuration = nextLineTime - currentLineTime;
            
            // If the duration is extremely short (less than 0.1s), just fill it immediately to prevent division by zero/weird math
            if (lineDuration > 0.1) {
                const timeElapsed = currentTime - currentLineTime;
                let percentage = (timeElapsed / lineDuration) * 100;
                
                // Clamp between 0 and 100
                percentage = Math.max(0, Math.min(100, percentage));
                
                activeEl.style.setProperty('--fill-percentage', `${percentage}%`);
            } else {
                activeEl.style.setProperty('--fill-percentage', '100%');
            }
        }

        // Calculate offset to center the active lyric
        if (activeEl) {
            // Calculate distance from the active element's top to the container's virtual center
            // Container height is 300px, so center is 150px.
            // We want the active element to be vertically centered.
            let offset = 0;
            
            for (let i = 0; i < this.currentLyricIndex; i++) {
                // Approximate height of past lines (margin + content)
                offset += this.lineElements[i].offsetHeight + 30; // 15px top/bottom margin
            }
            
            // Adjust offset to center the active line itself
            const activeLineHeight = activeEl.offsetHeight + 30;
            const containerCenter = 150;
            
            const translateY = -(offset - containerCenter + (activeLineHeight / 2));
            this.lyricsContainer.style.transform = `translateY(${translateY}px)`;
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
