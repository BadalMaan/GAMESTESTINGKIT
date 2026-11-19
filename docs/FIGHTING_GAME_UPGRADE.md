# Global Super Hero — One-Screen Anime Power Clash

## Current gameplay contract
- One-screen, side-by-side two-player arena.
- Player names and fighter selections are editable before each fight.
- Each round gives each side five shuffled, number-only power slots.
- Player 1 locks a number; Player 2 then locks a number. Picks remain hidden until both are locked.
- Optional CPU opponent can select from its own five hidden slots.
- The original power-strength contest remains the deciding rule. Fighter passives add a small, visible strength bonus.
- Health persists between rounds. The match ends when a fighter reaches zero; the result screen returns to player setup so names can be edited for the next fight.

## Engine modules
- `src/game/engine/combatEngine.ts`: attack profiles, startup/active/recovery timing, hitbox rectangles, collision test, damage, shields, healing, multi-hit combo damage and impact reaction metadata.
- `src/game/engine/aiEngine.ts`: optional CPU selection strategy using strength and elemental counters.
- `src/game/engine/audioEngine.ts`: synthesized, per-element Web Audio cues. Audio failure never blocks gameplay.
- `src/components/SuperheroClash.tsx`: battle flow, hidden number selection, procedural articulated fighter animation, power rendering and round management.

## Visual combat
- The clash canvas renders articulated character poses frame-by-frame with charge, wind-up, release, collision, breakthrough, impact and recovery states.
- Each power family has its own procedural silhouette/effect in the existing canvas renderer: lightning branches, fire waves, ice shards, shadow rings, solar rays, wind cuts, shields, impact/meteor, plasma, speed dash, water vortex/dragon and healing pulse.
- The effect renderer uses a capped particle pool, device-pixel-ratio scaling and `requestAnimationFrame`; the browser schedules frames at the display's refresh rate where supported.
- Fighter accent palettes and passive strength bonuses vary by selected character.

## Performance and verification
- Rendering targets high-refresh displays (including 120 Hz) but actual FPS depends on the display, browser, GPU, and device load.
- Combat engine TypeScript modules were type-checked independently and exercised for all 12 power families.
- TS/TSX syntax transpilation passed for the modified source files.
- Full Vite production build was not verified in this environment because project dependencies could not be installed (network/package access timed out). Run `npm install` then `npm run build` locally before deployment.

## Deploy
Run `npm install`, `npm run build`, and `npm run preview`. Deploy the project root to the existing hosting setup after the production build passes.
