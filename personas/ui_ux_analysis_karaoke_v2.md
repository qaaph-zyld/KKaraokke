# Iteration 2: Fixing the "Sketchy" Karaoke Visualization

## 1. Analysis of First Attempt Failure
Based on the visual output of our first Theater Mode implementation, the design looked "sketchy" and unpolished. Key issues identified from the screenshot:
- **The "Boxy" Fade Effect:** The `::before` and `::after` pseudo-elements on the lyrics window used hardcoded background colors to try and fade out the text. Because the body had a gradient background, this created massive, ugly rectangular blocks that broke the immersion.
- **Muddy Active Text:** The active lyrics used a heavily layered text-shadow approach combined with a pink-to-white gradient. Instead of looking like a vibrant neon highlight, the text looked dark, reddish, and muddy, bleeding into its own shadow.
- **Weak Typography:** The default sans-serif font weight wasn't thick enough. Karaoke requires incredibly heavy, bold typography (like Impact or Arial Black) so the color fill is easily visible from a distance.
- **Cluttered Overlap:** The audio controls and visualizer floated awkwardly in the bottom third of the screen, overlapping the upcoming lyrics and causing visual noise.

## 2. True Karaoke Visualization Principles
To stop reinventing the wheel, we must apply the exact techniques used by standard karaoke systems (Singa, Karafun, Joysound):
1. **The Font:** Must be ultra-heavy (`font-weight: 900`). A thick font provides a large surface area for the wipe animation.
2. **The Stroke (Crucial):** Karaoke lyrics don't just use drop shadows; they use a hard, thick black outline (stroke). This guarantees the text is 100% legible against *any* background video or color. We must use `-webkit-text-stroke`.
3. **The Fill / Wipe:** The base color of upcoming text is usually pure white or bright yellow. The "sung" text changes to a highly contrasting fluorescent color (Cyan, Magenta, or Lime Green). The transition must be sharp.
4. **The Alpha Masking:** Fading out text at the top and bottom of the screen should be done via CSS `mask-image` (alpha masking), which makes the text itself transparent without painting ugly background boxes over the page.

## 3. Remediation Plan
1. **Typography Overhaul:** Change the lyrics font to an ultra-bold stack (`'Arial Black', Impact, sans-serif`). Apply `-webkit-text-stroke: 2px black` to all lyrics.
2. **Remove Faux Gradients:** Delete the `::before` and `::after` pseudo-elements. Apply a `-webkit-mask-image: linear-gradient(...)` directly to the lyrics container to create a true alpha-fade at the top and bottom.
3. **Vibrant Wipe Effect:** Change the wipe to transition from a bright, luminous Cyan (`#00e5ff`) to pure White (`#ffffff`). Simplify the drop shadow so it doesn't muddy the colors.
4. **Layout Fix:** Push the visualizer to the very absolute bottom, lower the opacity, and ensure the lyrics container has enough padding so text never overlaps with the controls.
