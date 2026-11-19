# Global Punjabi Arena — Artwork & Combat Presentation Update

## Included in this update

- Replaced static fighter pose images in the live battle renderer with animated pose-strip assets.
- Added 25 pose frames for the blue-side hero and 25 coordinated red-side frames (50 pose images total).
- Added idle, cast, attack, guard, hurt-variation (four randomized reaction strips per side), and knockdown animation strips.
- Hurt animation selection changes between impacts so the same hit pose is not repeated every round.
- Power selection now shows large numbered plates 1–5 only. Once both players lock their choices, each panel reveals only the selected power icon and name.
- Removed long power descriptions and timing detail from the battle panel.
- Expanded the pool from 16 to 24 selectable powers.
- Integrated the 16 existing transparent elemental power artworks into the live Canvas renderer and shared image instances between moves.
- Changed the decisive projectile path so the winning power travels from its fighter to the opponent's body instead of stopping at the centre of the arena.
- Added a visible opponent impact bloom, recoil/knockback choreography, and different randomized hit-reaction art.
- Added a hard cap of 280 live particles to prevent uncontrolled particle growth during effects.

## Source files changed

- `src/components/SuperheroClash.tsx`
- `src/style.css`
- `public/images/fighters/poses/` (50 pose images and animation strips)

## Validation performed

- TypeScript/TSX transpile syntax check: passed (zero syntax diagnostics).
- CSS parse check: passed (zero top-level parse errors).
- Pose asset check: passed (50 individual pose files and all animation strips found).
- Power artwork check: passed (all 16 elemental texture files found).
- Full Vite production build: not verified in this environment because the npm dependencies could not be installed; run `npm install` and `npm run build` locally before deployment.
- 120 FPS: not claimed as a measured result. Rendering follows the browser's `requestAnimationFrame`; actual frame rate depends on the display, browser, and hardware.

## Deploy

From the `pga_next` directory:

```bash
npm install
npm run build
```

Deploy the resulting `dist` directory through the existing Netlify setup, or push the updated source to the connected Git repository and let Netlify build it.
