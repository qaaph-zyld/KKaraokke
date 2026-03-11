# UI/UX Analysis & Remediation Plan: Kkaraokee App

## 1. Problem Analysis: Why the initial design failed
Looking at the provided screenshot, the application suffers from severe UI/UX issues, particularly when it enters the "Performance/Karaoke Mode":

- **Lack of Contrast / Unreadable Text:** The lyrics text is white/light-grey on a very light, almost white background card, which sits on top of a light purple background. The text is entirely washed out and unreadable. 
- **Confused Visual Hierarchy:** The most important thing during karaoke is the lyrics. However, the screen is dominated by the setup UI (Upload Track, Add Lyrics boxes) and a massive audio visualizer. The lyrics are shoved to the bottom in a small card.
- **No "Context Switch":** A karaoke app has two distinct modes: 
  1. *Setup Mode*: Choosing the song and lyrics.
  2. *Performance Mode*: Singing the song.
  The current design tries to show both at the same time. During Performance Mode, the setup controls are irrelevant distractions.
- **Incorrect "Karaoke" Aesthetic:** Standard karaoke screens (like Singa, KaraFun, or YouTube karaoke videos) use dark backgrounds (usually black or deep gradients) with highly vibrant, high-contrast text (usually bright yellow, pink, or green) to ensure readability from a distance in a dimly lit room.

## 2. Industry Standard Patterns (Don't Reinvent the Wheel)
- **Background:** Deep, immersive dark mode (black, very dark blue/purple).
- **Typography:** Large, bold sans-serif fonts. Inactive lyrics are solid white or light grey. Active lyrics are highlighted with a bright, luminous color (hot pink, neon cyan, bright yellow).
- **Layout:** 
  - The lyrics should take up 80% of the screen real estate during playback.
  - Setup controls should disappear or minimize once playback starts.
- **Text Stroke/Shadow:** Lyrics always have a subtle black stroke or drop shadow to ensure they pop against any background.

## 3. The Fix: Action Plan
1. **Implement "Theater Mode":** When the user hits play, hide the setup cards (`.setup-container` or similar) to maximize screen real estate for the lyrics.
2. **Redesign Lyrics Container (`#lyrics-display`):**
   - Make it take up the majority of the viewport.
   - Remove the white background card. Use the full screen with a dark, immersive gradient background.
   - Increase base font size significantly.
3. **Fix the Typography & Contrast:**
   - Inactive lyrics: `color: rgba(255, 255, 255, 0.5)`
   - Upcoming lyrics: `color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8)`
   - Active lyrics highlight: Bright neon pink or cyan with text shadow.
4. **Smooth Transitions:** Add smooth CSS transitions so the UI gracefully shifts from setup to performance.
