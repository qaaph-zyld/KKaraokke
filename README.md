# 🎤 Kkaraokee - Free Open Source Karaoke App

A simple, web-based karaoke application that allows you to upload WAV audio tracks and synchronized lyrics to create your own karaoke experience.

## Features

- 🎵 **WAV Audio Support**: Upload any WAV file as your karaoke backing track
- 📝 **Lyric Synchronization**: Add lyrics with timestamps for perfect timing
- 🎮 **Playback Controls**: Play, pause, stop, and seek through your tracks
- 📊 **Audio Visualization**: Real-time frequency visualization while playing
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🆓 **Free & Open Source**: No costs, no ads, completely free to use

## How to Use

### 1. Upload Audio Track
- Click on "Choose WAV file" to select your audio file
- Only WAV format is supported for best quality
- The file name will appear once uploaded

### 2. Add Lyrics
- Enter your lyrics in the text area using timestamp format:
  ```
  [00:00] First line of lyrics
  [00:05] Second line of lyrics  
  [00:10] Third line of lyrics
  ```
- Timestamps use MM:SS format (minutes:seconds)
- Click "Parse Lyrics" to process the text
- Lyrics without timestamps will be displayed but not synchronized

### 3. Play Karaoke
- Once both audio and lyrics are loaded, the player will appear
- Use the play button to start the karaoke
- Current lyrics highlight in blue, next lyrics appear in gray
- Control playback with the progress bar or control buttons

## Technical Details

### Supported File Formats
- **Audio**: WAV (.wav) only
- **Lyrics**: Plain text with timestamp formatting

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

### Audio Features
- Web Audio API for visualization
- HTML5 Audio element for playback
- Real-time frequency analysis
- Synchronized lyric display

## Development

This is a pure frontend application using:
- HTML5 for structure
- CSS3 for styling (with gradients and animations)
- Vanilla JavaScript for functionality
- Web Audio API for audio processing

### File Structure
```
kkaraokee/
├── index.html      # Main application interface
├── styles.css      # Styling and responsive design
├── script.js       # Core karaoke functionality
└── README.md       # This documentation
```

## Contributing

As an open source project, contributions are welcome! You can:
- Report bugs and issues
- Suggest new features
- Submit pull requests for improvements
- Share your karaoke creations

## License

This project is released under the MIT License, making it free to use, modify, and distribute.

## Future Enhancements

Potential features for future versions:
- Support for additional audio formats (MP3, OGG)
- Lyric editor with visual timeline
- Playlist management
- Recording capabilities
- Keyboard shortcuts
- Fullscreen mode
- Custom themes and styling

---

**Start creating your karaoke experience today! 🎤**
