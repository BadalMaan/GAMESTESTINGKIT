# Global Punjabi Arena — Standalone Anime Clash

A self-contained browser fighting game is available at `public/arena.html`.

## Run
- Start the existing Vite app with `npm install` and `npm run dev`.
- Open `http://localhost:5173/arena.html`.
- Or open `public/arena.html` directly in a modern browser.

## Included
- Original Aether and Kaida fighter artwork rendered from the supplied transparent character poses and authored elemental effect assets.
- One-screen local two-player flow; names are editable before each match.
- Five hidden numbered power options per player, revealed only after both picks lock.
- Twelve distinct elemental/physical move visual identities, attack timings, damage values, multi-hit values, shields and healing.
- Animated charge, wind-up, release, impact and recovery phases; particles, screen shake and synthesized sound effects.
- Best-of-three match flow and next-match setup.
- `requestAnimationFrame` rendering, responsive canvas and device-pixel-ratio cap of 1.5. FPS display is a live measured estimate; actual 120 FPS depends on the display, browser and device.

This standalone build is intentionally independent of the existing React dashboard so the arena can be played as a focused full-screen game. The original platform remains in the project unchanged.
