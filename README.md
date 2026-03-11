# Kkaraokee - Auto-Sync Lyrics Karaoke Web App

A free, open-source local web application that allows you to upload any WAV or MP3 audio file, paste raw text lyrics, and automatically generate a beautifully synchronized karaoke experience using AI.

## Features
- **Upload Audio**: Supports both `.wav` and `.mp3`.
- **Paste Lyrics**: Just paste plain text lyrics.
- **🤖 Auto-Sync (AI)**: Uses OpenAI Whisper and Levenshtein distance alignment to automatically generate high-precision (`[MM:SS.xx]`) timestamps for your lyrics.
- **Interactive Sync**: If you prefer, manually sync lyrics using the Spacebar.
- **Smooth Playback UI**: Hardware-accelerated smooth scrolling UI that keeps the active lyric centered, fading out past lines and highlighting the current one.
- **Audio Visualizer**: Real-time waveform visualization while playing.

## Requirements
- Python 3.13+
- Node.js (Optional, for running frontend) or Python's built-in HTTP server.

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kkaraokee/windsurf-project.git
   cd windsurf-project
   ```

2. **Install Python Backend Dependencies**
   ```bash
   pip install flask flask-cors openai-whisper python-Levenshtein werkzeug
   ```
   *Note: Whisper may also require `ffmpeg` to be installed on your system.*

## Usage

You must run both the Frontend web server and the Backend API server simultaneously.

### 1. Start the Backend API Server
In a terminal, navigate to the project directory and run:
```bash
python app.py
```
This will start the Flask server on `http://127.0.0.1:5000`. The first run will download the Whisper "base" model.

### 2. Start the Frontend Web Server
In a second terminal, navigate to the project directory and run:
```bash
python -m http.server 3000
```
*(Or use any other static file server like `npx serve -p 3000`)*

### 3. Open the App
Open your web browser and go to `http://localhost:3000`.

### 4. How to Create a Karaoke Track
1. Click **Choose Audio (WAV/MP3)** and select your track.
2. Paste the plain text lyrics into the text area.
3. Click the **🤖 Auto-Sync** button.
4. Wait for the backend to process the audio (Check your terminal running `app.py` for progress).
5. Once complete, the synced lyrics with timestamps will appear. Click **▶️ Play** to enjoy your smoothly scrolling karaoke!

## Troubleshooting
- **Failed to fetch / CORS Errors**: Ensure the Python backend is running and that you are accessing the frontend via `http://localhost:3000` or `http://127.0.0.1:3000`.
- **Whisper FP16 Warning**: If you see a warning about FP16 not supported on CPU, this is normal and can be safely ignored.
- **Auto-Sync takes too long**: Processing time depends heavily on your CPU and the length of the song. The "base" model is used for speed, but large files will still take time.
