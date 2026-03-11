# Kkaraokee - Auto-Sync Lyrics Karaoke Web App

A free, open-source local web application that allows you to upload any WAV or MP3 audio file, paste raw text lyrics, and automatically generate a beautifully synchronized karaoke experience using AI.

## Features
- **Upload Audio**: Supports both `.wav` and `.mp3`.
- **Paste Lyrics**: Just paste plain text lyrics.
- **Auto-Sync (AI)**: Uses OpenAI Whisper and Levenshtein distance alignment to automatically generate high-precision (`[MM:SS.xx]`) timestamps for your lyrics.
- **Interactive Sync**: Manually sync lyrics using the Spacebar in real-time.
- **Theater Mode**: Full-screen immersive karaoke playback with centered, scrolling lyrics and a classic wipe effect (cyan-to-white gradient fill).
- **Audio Waveform**: Real-time waveform visualization powered by [wavesurfer.js](https://wavesurfer-js.org/).

## Architecture

```
Frontend (Static HTML/JS)          Backend (Python Flask)
┌───────────────────────┐          ┌──────────────────────┐
│  index.html           │          │  app.py              │
│  ├─ Tailwind CSS CDN  │  HTTP    │  ├─ /api/sync        │
│  ├─ wavesurfer.js CDN │ ──────►  │  ├─ Whisper (ASR)    │
│  ├─ karaoke.css       │          │  └─ Levenshtein align │
│  └─ script.js         │          └──────────────────────┘
└───────────────────────┘
```

### Frontend Stack
| Component | Source | Purpose |
|-----------|--------|---------|
| **Tailwind CSS** (CDN) | [tailwindcss.com](https://tailwindcss.com) | All layout, spacing, colors, typography, responsive design |
| **wavesurfer.js v7** (CDN) | [wavesurfer-js.org](https://wavesurfer-js.org) | Audio waveform visualization |
| **karaoke.css** (custom, ~100 lines) | Local | Karaoke wipe effect (`background-clip: text`), alpha-mask fade, lyrics scroll |
| **script.js** (vanilla JS) | Local | `KaraokePlayer` class — view management, lyrics engine, playback |

### Backend Stack
| Component | Purpose |
|-----------|---------|
| **Flask + CORS** | REST API server |
| **OpenAI Whisper** | Audio transcription (ASR) |
| **python-Levenshtein** | Fuzzy text alignment for timestamp mapping |

### Views
The app uses three distinct views managed by `showView()`:
1. **Setup View** — Upload audio, paste lyrics, trigger sync
2. **Sync View** — Interactive timestamp stamping with spacebar
3. **Player View** — Full-screen theater mode with karaoke wipe effect

## Requirements
- Python 3.10+
- `ffmpeg` installed and on PATH (required by Whisper)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/qaaph-zyld/KKaraokke.git
   cd KKaraokke
   ```

2. **Install Python Backend Dependencies**
   ```bash
   pip install flask flask-cors openai-whisper python-Levenshtein werkzeug
   ```

## Usage

Run both servers simultaneously.

### 1. Start the Backend API Server
```bash
python app.py
```
Starts Flask on `http://127.0.0.1:5000`. First run downloads the Whisper "base" model.

### 2. Start the Frontend Web Server
```bash
python -m http.server 3000
```

### 3. Open the App
Navigate to `http://localhost:3000`.

### 4. Create a Karaoke Track
1. Click the audio upload area and select your track.
2. Paste plain text lyrics into the text area.
3. Click **Auto-Sync** (or use **Interactive Sync** for manual stamping).
4. Wait for processing (check the terminal running `app.py` for progress).
5. The app enters **Theater Mode** — full-screen karaoke with the wipe effect.

## Troubleshooting
- **CORS Errors**: Ensure the Python backend is running and you access the frontend via `http://localhost:3000`.
- **Whisper FP16 Warning**: Normal on CPU, can be ignored.
- **Slow sync**: Processing time depends on CPU and song length. The "base" model balances speed and accuracy.
- **Stale UI**: Hard-refresh with `Ctrl+Shift+R` to bypass browser cache.
