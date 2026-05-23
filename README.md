# HOME WINDOWS — Interactive CSS Scene

A responsive, interactive **house landscape** built with pure **HTML, CSS, and JavaScript**. Change the time of day, weather, and lighting; listen to generative ambient sound; tap the scene for **full-screen mode** on mobile and desktop.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## Live demo

Open `Рисование.html` in any modern browser (Chrome, Firefox, Safari, Edge).

> **No image files needed** — the cat in the window is drawn with **CSS pixel art** (generated from a grid in JavaScript).

## Features

| Area | Details |
|------|---------|
| **Scene** | House, roof, arched window with **pixel cat**, chimney smoke, fence with gate, birds, clouds, sun/moon |
| **Time of day** | Day, sunset, night, aurora — smooth CSS variable transitions |
| **Weather** | Clear, rain, snow, wind (particles + fence sway) |
| **Cloud shadows** | Soft shadows on the grass that move with the clouds |
| **Lights** | Toggle window glow via button or by clicking the window |
| **Sound** | Procedural rain, wind, crickets, and birds (Web Audio API) |
| **Full screen** | Tap the scene — landscape only, controls hidden; exit with × or Esc |
| **Responsive** | Scales on phones, tablets, and desktop (`container-type` + safe areas) |

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/home-windows-css-scene.git
cd home-windows-css-scene
```

Then open `Рисование.html` locally, or use a simple server:

```bash
npx --yes serve .
# open http://localhost:3000/Рисование.html
```

No build step, npm install, or image assets required.

## Project structure

```
├── Рисование.html   # Markup & controls
├── Рисование.css    # Scene art, themes, animations, responsive layout
├── Рисование.js     # Pixel cat, weather, stars, audio, fence, full screen
└── README.md
```

## Controls

- **Time of day** — Day / Sunset / Night / Aurora  
- **Weather** — Clear / Rain / Snow / Wind  
- **Lights** — On / Off (or click the house window)  
- **Sound** — Generative ambient on/off  
- **Fence gate** — Click to open/close  
- **Full screen** — Tap anywhere on the scene (not the window or gate)

## Pixel cat

The window cat is built from a **23×14 character map** in `Рисование.js` (`PIXEL_CAT_ART` + `PIXEL_CAT_PALETTE`). Each non-empty cell becomes a 2×2 px `<span>`. Edit the grid or colors to change the sprite.

## Tech highlights

- CSS custom properties for theming  
- `@keyframes` for clouds, smoke, birds, aurora, stars  
- `container-type` for scaling the 1000×500 artboard  
- Fullscreen API with a CSS fallback for older mobile browsers  
- Web Audio: noise buffers, filters, LFO wind, procedural crickets/birds  

## Publishing on SoloLearn

1. Create a **Web** project (HTML / CSS / JS tabs).  
2. Paste the contents of each file into the matching tab.  
3. No external images — the pixel cat works out of the box.  
4. Suggested title: **Interactive CSS House Scene**  
5. Suggested description: *Pure CSS house with pixel cat, day/night, weather, lights, sound, and tap-to-fullscreen.*

## License

MIT — feel free to use, modify, and share with attribution.
