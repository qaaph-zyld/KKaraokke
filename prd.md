# Karaoke App Auto-Sync PRD & Strategy

## 1. Main Goal
Deliver a fully functional, local web-based Karaoke application that accepts audio (WAV/MP3) and raw lyrics text, automatically synchronizes them using AI (OpenAI Whisper + Levenshtein distance), and provides a smooth, visually appealing scrolling playback experience.

## 2. Current Roadblocks & Rethink Strategy
**The Problem**: The user reported "nothing happening" when clicking the Auto-Sync button. This indicates a breakdown in the integration between the Frontend (JS) and Backend (Flask). 
**The Cause**: It could be one of the following:
1.  **Frontend Silently Failing**: The JavaScript `fetch` call might be failing before it hits the network (e.g., trying to read an empty file input).
2.  **CORS/Network Issue**: The browser is blocking the request from `localhost:3000` to `127.0.0.1:5000`.
3.  **Backend Hanging**: The Python server crashes or hangs on large files without returning an HTTP response.

**The Strategy**:
1.  **Strengthen Integration**: Add explicit UI alerts and robust `try/catch` console logging in the frontend so we never get a silent failure again.
2.  **Ensure Explicit URLs**: Standardize the backend URL to `http://127.0.0.1:5000/api/sync` on both ends to avoid `localhost` vs `127.0.0.1` CORS mismatches.
3.  **Local End-to-End Test**: Run a local Python test script to confirm the Flask `/api/sync` endpoint works with `Little_planet.wav` and `Little_plannet.md`.
4.  **Commit & Push**: Once the end-to-end test works and plays correctly in the browser, commit the code and push to GitHub.

## 3. Product Requirements
- **Audio Upload**: Support for `.wav` and `.mp3`.
- **Lyrics Input**: Text area for pasting raw lyrics.
- **Auto-Sync (AI)**: Send audio and lyrics to the backend. Backend uses Whisper to get word-level timestamps, then fuzzy-matches (Levenshtein) the user's lyrics to the audio, returning `[MM:SS.xx]` formatted text.
- **Playback UI**: Smooth, scrolling list of lyrics that centers the active line and changes opacity/size based on playback time, using a 60fps `requestAnimationFrame` loop.
- **Documentation & Version Control**: Thorough `README.md` and a clean push to the GitHub repository.
