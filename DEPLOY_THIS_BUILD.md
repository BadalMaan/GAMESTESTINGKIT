# Deploy this build

This is the full Global Punjabi Game Arena project. The Global Super Hero game remains under the existing `Global Super Hero` section. Existing power names, rounds, health, clash outcomes and MegaPower/Shield rules have been retained.

## Netlify
- Base directory: leave blank
- Build command: `npm run build`
- Publish directory: `dist`
- Install command: `npm install`

The build script uses Vite to produce the production site. `npm run typecheck` is available separately for TypeScript checking.

## 3D characters
The arena builds two rigged human characters using Ara 3D Gen at runtime. Its CC0 MakeHuman character data and CMU motion clips are served by the documented Ara CDN, so the deployed browser needs access to that CDN on first load. If the connection is blocked, the page reports a 3D loading error rather than silently pretending the models loaded.

## Audio
Original local WAV sound effects are bundled under `public/audio/`. The existing AHHH and Get Out Loser voice clips remain as originally selected in the project.
