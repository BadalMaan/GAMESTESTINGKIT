# Global Super Hero — Final Power Clash Package

This package is the consolidated V6 project with the project files at the ZIP root for Netlify deployment.

## Netlify settings
- Base directory: leave blank
- Build command: `npm run build`
- Output / publish directory: `dist`
- Install command: `npm install` (or leave Netlify's default install command)

## Main game
- Open `/arena.html` after deployment.
- The main arena remains full viewport (100vw × 100vh) and uses the existing light/daytime styling.
- Gameplay rules and existing power roster are preserved.
- Megapower beats every non-shield, non-megapower power and deals 45% damage when it wins.
- Megapower vs Shield and Megapower vs Megapower cause zero damage/effect.
- Shield blocks damage in the clash; only the losing fighter is damaged in a normal decisive clash.
- Hit voice and loser taunt are mutually exclusive. The hit voice is only played on a damaging hit; the loser voice is only played after match victory, following the victory fanfare.
- Element selection cues are staggered so the two power cues play sequentially rather than overlapping. The clash has its own heavier synthesized impact sound.

## Honest visual note
The standalone `/arena.html` fighter visuals are still the existing canvas-rendered character system. This package does not yet contain photorealistic, rigged 3D human fighter models. The repository also contains a separate Three.js duel component, but it is not the renderer used by `/arena.html`.
