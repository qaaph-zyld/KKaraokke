import os
import tempfile
import whisper
import Levenshtein
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Load the whisper model (using 'base' for faster processing, can be changed to 'small' or 'medium' for better accuracy)
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded!")

def format_timestamp(seconds):
    """Convert seconds to [MM:SS.xx] format"""
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    hundredths = int((seconds % 1) * 100)
    return f"[{minutes:02d}:{remaining_seconds:02d}.{hundredths:02d}]"

def align_lyrics(whisper_segments, user_lines):
    """
    Align user-provided lyrics with Whisper transcription segments
    using Levenshtein distance to find the best matches.
    Interpolates timestamps for unmatched lines.
    """
    # Pre-process user lines (remove empty ones)
    user_lines = [line.strip() for line in user_lines if line.strip()]
    
    if not user_lines or not whisper_segments:
        return []

    # Array to hold the matched start times for each user line. None if unmatched.
    line_times = [None] * len(user_lines)
    
    user_idx = 0
    whisper_idx = 0
    
    while user_idx < len(user_lines) and whisper_idx < len(whisper_segments):
        user_line = user_lines[user_idx]
        best_match_idx = whisper_idx
        best_ratio = 0.0
        
        # Look ahead a few segments to find the best match for the current user line
        lookahead = min(whisper_idx + 5, len(whisper_segments))
        for i in range(whisper_idx, lookahead):
            segment_text = whisper_segments[i]['text'].strip()
            # Calculate similarity ratio
            ratio = Levenshtein.ratio(user_line.lower(), segment_text.lower())
            if ratio > best_ratio:
                best_ratio = ratio
                best_match_idx = i
                
        # Only accept match if ratio is somewhat reasonable
        if best_ratio > 0.3:
            line_times[user_idx] = whisper_segments[best_match_idx]['start']
            whisper_idx = best_match_idx + 1
        
        user_idx += 1
        
    # Interpolate missing timestamps
    # First, handle the beginning if it's missing
    if line_times[0] is None:
        line_times[0] = 0.0

    # Fill in the gaps
    for i in range(len(line_times)):
        if line_times[i] is None:
            # Find the next known time
            next_known_idx = -1
            for j in range(i + 1, len(line_times)):
                if line_times[j] is not None:
                    next_known_idx = j
                    break
            
            if next_known_idx != -1:
                # Interpolate between line_times[i-1] and line_times[next_known_idx]
                prev_time = line_times[i-1]
                next_time = line_times[next_known_idx]
                num_missing = next_known_idx - (i - 1)
                time_step = (next_time - prev_time) / num_missing
                
                for k in range(i, next_known_idx):
                    line_times[k] = line_times[k-1] + time_step
            else:
                # No next known time, just add 2.5 seconds per line as an estimate
                line_times[i] = line_times[i-1] + 2.5

    aligned_lyrics = []
    for i, line in enumerate(user_lines):
        aligned_lyrics.append(f"{format_timestamp(line_times[i])} {line}")

    return aligned_lyrics

@app.route('/api/sync', methods=['POST'])
def sync_lyrics():
    if 'audio' not in request.files or 'lyrics' not in request.form:
        return jsonify({'error': 'Missing audio file or lyrics text'}), 400
        
    audio_file = request.files['audio']
    lyrics_text = request.form['lyrics']
    
    if audio_file.filename == '':
        return jsonify({'error': 'No audio file selected'}), 400
        
    user_lines = lyrics_text.split('\n')
    
    # Save audio to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
        audio_path = temp_audio.name
        audio_file.save(audio_path)
        
    try:
        # Transcribe and get timestamps
        print(f"Transcribing audio file: {audio_path}")
        result = model.transcribe(audio_path, word_timestamps=True)
        
        segments = result['segments']
        print(f"Transcription complete. Found {len(segments)} segments.")
        
        # Align timestamps with user lyrics
        aligned_lines = align_lyrics(segments, user_lines)
        
        return jsonify({
            'success': True,
            'synced_lyrics': '\n'.join(aligned_lines),
            'raw_transcription': '\n'.join([f"[{format_timestamp(s['start'])}] {s['text']}" for s in segments])
        })
        
    except Exception as e:
        import traceback
        print(f"Error during transcription: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
        
    finally:
        # Clean up temp file
        if os.path.exists(audio_path):
            os.remove(audio_path)

if __name__ == '__main__':
    app.run(port=5000, debug=True, use_reloader=False)
