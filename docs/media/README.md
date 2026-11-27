# Media & External Proof Drop-In Guide

Drop your captured PNGs in this folder and paste the snippets below into the root `README.md` under **Visual Walkthrough**.

## Recommended Captures

| File | Viewport / Tool | What to Capture |
|---|---|---|
| `desktop-hero.png` | `1440x900` Chrome | Hero headline, 3D `NeuralBrain`, and Live Trace Sandbox |
| `desktop-pricing.png` | `1440x900` Chrome | `CapabilitiesGrid` or `PricingCalculator` + `BeforeAfterSection` |
| `mobile-native.png` | `390x844` (OnePlus 12R) | 2-up or 3-up composite showing 2×2 Capabilities, stacked `PairedBars`, and 3-col Retention |
| `lighthouse-desktop.png` | PageSpeed Insights | Desktop scores on `spanrail.vercel.app` |
| `lighthouse-mobile.png` | PageSpeed Insights | Mobile scores on `spanrail.vercel.app` |

## Adding an Inline Interactive Video (Zero Git Bloat)

GitHub strips `<video>` tags in Markdown, so host your short 10–15s H.264 `.mp4` (`< 10 MB`) via GitHub's uploader:

1. Open any GitHub Issue or click **Edit** on `README.md` in the GitHub web UI.
2. Drag and drop your `.mp4` (showing the 3 guardrail switches changing `NeuralBrain` color and collapsing the waterfall bars).
3. GitHub prints a bare asset URL (`https://github.com/user-attachments/assets/...`).
4. Paste that bare URL on its own line in `README.md` — GitHub renders a native HTML5 video player automatically.

## Ready-to-Paste Screenshot Markdown

```markdown
### Visual Walkthrough

| Desktop (`1440×900`) | Mobile Native (`390×844` · OnePlus 12R) |
| :---: | :---: |
| <img src="docs/media/desktop-hero.png" alt="Spanrail desktop hero and live trace sandbox" width="560" /> | <img src="docs/media/mobile-native.png" alt="Spanrail mobile-native layouts on OnePlus 12R" width="260" /> |
```